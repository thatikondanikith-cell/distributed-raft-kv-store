package com.raft.backend.raft.service;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.raft.backend.entity.KeyValue;
import com.raft.backend.raft.model.AppendEntriesRequest;
import com.raft.backend.raft.model.AppendEntriesResponse;
import com.raft.backend.raft.model.LogEntry;
import com.raft.backend.raft.model.RaftCluster;
import com.raft.backend.raft.model.RequestVoteRequest;
import com.raft.backend.raft.model.RequestVoteResponse;
import com.raft.backend.raft.state.NodeState;
import com.raft.backend.repository.KeyValueRepository;
import com.raft.backend.service.StateMachineService;

@Service
public class RaftService {

    private final RaftCluster cluster;

    private RaftNode leaderNode;

    private boolean leaderAlive = true;
    private final StateMachineService stateMachineService;
    private final KeyValueRepository repository;

    private static final int SNAPSHOT_THRESHOLD = 5;
    private int lastIncludedIndex = -1;
    private int lastIncludedTerm = 0;

    public RaftService(StateMachineService stateMachineService, 
        KeyValueRepository repository) {

        this.stateMachineService = stateMachineService;
        this.repository = repository;

        cluster = new RaftCluster();

        RaftNode node1 = new RaftNode("Node-1");
        RaftNode node2 = new RaftNode("Node-2");
        RaftNode node3 = new RaftNode("Node-3");

        cluster.addNode(node1);
        cluster.addNode(node2);
        cluster.addNode(node3);

        leaderNode = node1;
    }

    public void updateNodeHealths() {
        for (RaftNode node : cluster.getNodes()) {
            if (!node.isOnline()) {
                node.setHealth(0);
                continue;
            }

            int communicableNodes = 0;
            int otherNodesCount = 0;

            for (RaftNode other : cluster.getNodes()) {
                if (other == node) {
                    continue;
                }
                otherNodesCount++;
                if (other.isOnline() && node.canCommunicateWith(other.getNodeId()) && other.canCommunicateWith(node.getNodeId())) {
                    communicableNodes++;
                }
            }

            if (otherNodesCount == 0) {
                node.setHealth(100);
            } else {
                double communicationRatio = (double) communicableNodes / otherNodesCount;
                node.setHealth((int) (20 + 80 * communicationRatio));
            }
        }
    }

    public RaftCluster getCluster() {
        updateNodeHealths();
        return cluster;
    }

    public RaftNode getRaftNode() {
        return leaderNode;
    }

    // ====================================================
    // APPEND ENTRIES + MAJORITY ACK
    // ====================================================

    private AppendEntriesResponse sendAppendEntries(
            RaftNode follower,
            AppendEntriesRequest request) {

        System.out.println("\nSending AppendEntries RPC to "
                + follower.getNodeId());

        if (!canCommunicate(leaderNode, follower)) {

            System.out.println(
                    "Network Partition between "
                            + leaderNode.getNodeId()
                            + " and "
                            + follower.getNodeId());

            return new AppendEntriesResponse(
                    request.getTerm(),
                    false
            );
        }

        // Reject older term
        if (request.getTerm() < follower.getCurrentTerm()) {

            System.out.println("Rejected! Leader has older term.");

            return new AppendEntriesResponse(
                    follower.getCurrentTerm(),
                    false
            );
        }

        // Update follower term
        if (request.getTerm() > follower.getCurrentTerm()) {

            follower.setCurrentTerm(request.getTerm());

            follower.setCurrentState(NodeState.FOLLOWER);

            follower.setVotedFor(null);

            System.out.println(
                    follower.getNodeId()
                            + " updated to higher term "
                            + request.getTerm()
            );
        }

        // Validate previous index
        if (request.getPrevLogIndex() >= follower.getLogEntriesSize()) {

            System.out.println(
                    "Rejected! Previous Log Index not found."
            );

            return new AppendEntriesResponse(
                    follower.getCurrentTerm(),
                    false
            );
        }

        // Validate previous term
        if (request.getPrevLogIndex() >= 0) {

            int followerPrevTerm = follower.getLogTerm(request.getPrevLogIndex());

            if (followerPrevTerm != request.getPrevLogTerm()) {

                System.out.println(
                        "Rejected! Previous Log Term mismatch."
                );

                return new AppendEntriesResponse(
                        follower.getCurrentTerm(),
                        false
                );
            }
        }

        // -------------------------------
        // ACTUAL LOG REPLICATION
        // -------------------------------

        follower.removeLogsFrom(request.getPrevLogIndex() + 1);

        if (!request.getEntries().isEmpty()) {

            for (LogEntry entry : request.getEntries()) {

                follower.addLogEntry(
                        new LogEntry(
                                entry.getTerm(),
                                entry.getKey(),
                                entry.getValue()
                        )
                );

                System.out.println(
                        "Replicated : "
                                + entry.getKey()
                                + " -> "
                                + entry.getValue()
                );
            }
        }

        // ------------------------------------------
        // Update Commit Index from Leader
        // ------------------------------------------

        if (request.getLeaderCommit() > follower.getCommitIndex()) {

            int newCommitIndex = Math.min(
                    request.getLeaderCommit(),
                    follower.getLastLogIndex()
            );

            follower.setCommitIndex(newCommitIndex);

            System.out.println(
                    follower.getNodeId()
                            + " Commit Index Updated -> "
                            + newCommitIndex
            );

            if (newCommitIndex >= SNAPSHOT_THRESHOLD) {
                follower.createSnapshot(newCommitIndex);
            }
        }

        follower.setLastHeartbeatTime(System.currentTimeMillis());

        // Update EWMA stats BEFORE resetting the adaptive timeout
        follower.recordHeartbeatArrival();

        follower.resetElectionTimeout();

        follower.setCurrentState(NodeState.FOLLOWER);

        System.out.println(
                "AppendEntries Accepted by "
                        + follower.getNodeId()
        );

        return new AppendEntriesResponse(
                follower.getCurrentTerm(),
                true
        );
    }

    private boolean replicateToFollower(RaftNode follower) {

        while (true) {

            if (!canCommunicate(leaderNode, follower)) {
                System.out.println("Replication blocked by Network Partition to " + follower.getNodeId());
                return false;
            }

            int nextIndex = leaderNode.getNextIndex()
                    .getOrDefault(
                            follower.getNodeId(),
                            leaderNode.getLogEntriesSize()
                    );

            int prevLogIndex = nextIndex - 1;

            int prevLogTerm = 0;

            if (prevLogIndex >= 0 &&
                    prevLogIndex < leaderNode.getLogEntriesSize()) {

                prevLogTerm = leaderNode.getLogTerm(prevLogIndex);
            }

            List<LogEntry> entries = leaderNode.getLogEntriesSubList(nextIndex);

            // Lagging follower / InstallSnapshot simulation
            if (entries == null) {
                System.out.println("Follower " + follower.getNodeId() + " is behind leader's snapshot. Syncing snapshot.");
                follower.setLastIncludedIndex(leaderNode.getLastIncludedIndex());
                follower.setLastIncludedTerm(leaderNode.getLastIncludedTerm());
                follower.getLogEntries().clear();
                for (LogEntry entry : leaderNode.getLogEntries()) {
                    follower.getLogEntries().add(new LogEntry(entry.getTerm(), entry.getKey(), entry.getValue()));
                }
                follower.setCommitIndex(leaderNode.getLastIncludedIndex());
                leaderNode.getMatchIndex().put(follower.getNodeId(), leaderNode.getLastLogIndex());
                leaderNode.getNextIndex().put(follower.getNodeId(), leaderNode.getLogEntriesSize());
                follower.setLastHeartbeatTime(System.currentTimeMillis());
                follower.resetElectionTimeout();
                return true;
            }

            AppendEntriesRequest request =
                    new AppendEntriesRequest(

                            leaderNode.getCurrentTerm(),

                            leaderNode.getNodeId(),

                            prevLogIndex,

                            prevLogTerm,

                            entries,

                            leaderNode.getCommitIndex()
                    );

            AppendEntriesResponse response =
                    sendAppendEntries(follower, request);

            if (response.isSuccess()) {

                leaderNode.getMatchIndex().put(
                        follower.getNodeId(),
                        leaderNode.getLastLogIndex()
                );

                leaderNode.getNextIndex().put(
                        follower.getNodeId(),
                        leaderNode.getLogEntriesSize()
                );

                follower.setLastHeartbeatTime(
                        System.currentTimeMillis()
                );

                follower.resetElectionTimeout();

                System.out.println(
                        follower.getNodeId()
                        + " synchronized."
                );

                return true;
            }

            if (response.getTerm() > leaderNode.getCurrentTerm()) {

                leaderNode.setCurrentTerm(response.getTerm());

                leaderNode.setCurrentState(NodeState.FOLLOWER);

                leaderNode.setVotedFor(null);

                leaderAlive = false;

                return false;
            }

            if (nextIndex == 0) {

                System.out.println(
                        "No matching log found for "
                        + follower.getNodeId()
                );

                return false;
            }

            leaderNode.getNextIndex().put(
                    follower.getNodeId(),
                    nextIndex - 1
            );

            System.out.println(
                    follower.getNodeId()
                    + " rejected AppendEntries. nextIndex -> "
                    + (nextIndex - 1)
            );
        }
    }

    private void updateCommitIndex() {

        int lastLogIndex = leaderNode.getLastLogIndex();

        for (int index = lastLogIndex;
            index > leaderNode.getCommitIndex();
            index--) {

            // Raft Rule:
            // Only commit entries from CURRENT TERM

            if (leaderNode.getLogTerm(index) != leaderNode.getCurrentTerm()) {

                continue;
            }

            int replicatedCount = 1;

            for (RaftNode node : cluster.getNodes()) {

                if (node == leaderNode) {
                    continue;
                }

                Integer match =
                        leaderNode.getMatchIndex()
                                .get(node.getNodeId());

                if (match != null && match >= index) {

                    replicatedCount++;
                }
            }

            int majority =
                    (cluster.getNodes().size() / 2) + 1;

            if (replicatedCount >= majority) {

                leaderNode.setCommitIndex(index);

                System.out.println(
                        "Commit Index Updated -> " + index
                );

                break;
            }
        }
    }

    public void appendLogEntry(LogEntry logEntry) {

        System.out.println("\n========== APPEND ENTRIES ==========");

        leaderNode.addLogEntry(logEntry);

        System.out.println(
                leaderNode.getNodeId()
                + " appended log locally."
        );

        int ackCount = 1;

        for (RaftNode node : cluster.getNodes()) {

            if (node == leaderNode || !node.isOnline()) {
                continue;
            }

            if (replicateToFollower(node)) {

                ackCount++;

                System.out.println(
                        node.getNodeId()
                        + " ACK received."
                );
            }
        }

        System.out.println("\nACK Count : " + ackCount);

        updateCommitIndex();

        if (leaderNode.getCommitIndex()
                == leaderNode.getLastLogIndex()) {

            System.out.println("Majority Achieved.");

            stateMachineService.apply(logEntry);

            createSnapshot();

        } else {

            System.out.println("Majority NOT achieved.");
        }

        System.out.println("====================================");
    }

    // ====================================================

    public void becomeLeader() {

        leaderAlive = true;

        for (RaftNode node : cluster.getNodes()) {
            node.setCurrentState(NodeState.FOLLOWER);
        }

        leaderNode.setCurrentState(NodeState.LEADER);

        leaderNode.getNextIndex().clear();

        for (RaftNode node : cluster.getNodes()) {

            if (!node.getNodeId().equals(leaderNode.getNodeId())) {

                leaderNode.getNextIndex().put(
                        node.getNodeId(),
                        leaderNode.getLogEntriesSize()
                );

                leaderNode.getMatchIndex().put(
                        node.getNodeId(),
                        -1
                );
            }
        }

        sendHeartbeat();
    }

    public void sendHeartbeat() {

        if (!leaderAlive || !leaderNode.isOnline()) {
            return;
        }

        long currentTime = System.currentTimeMillis();

        leaderNode.setLastHeartbeatTime(currentTime);

        System.out.println("\n❤️ Leader : " + leaderNode.getNodeId());

        for (RaftNode node : cluster.getNodes()) {

            if (node == leaderNode) {
                continue;
            }

            if (!node.isOnline()) {
                continue;
            }

            if (!canCommunicate(leaderNode, node)) {

                System.out.println(
                        "Heartbeat blocked by Network Partition to "
                                + node.getNodeId());

                continue;
            }

            int nextIndex = leaderNode.getNextIndex()
                    .getOrDefault(node.getNodeId(), leaderNode.getLogEntriesSize());

            int prevLogIndex = nextIndex - 1;

            int prevLogTerm = 0;

            if (prevLogIndex >= 0 &&
                    prevLogIndex < leaderNode.getLogEntriesSize()) {

                prevLogTerm = leaderNode.getLogTerm(prevLogIndex);
            }

            List<LogEntry> entries = leaderNode.getLogEntriesSubList(nextIndex);

            // Lagging follower / InstallSnapshot simulation
            if (entries == null) {
                System.out.println("Follower " + node.getNodeId() + " is behind leader's snapshot during heartbeat. Syncing snapshot.");
                node.setLastIncludedIndex(leaderNode.getLastIncludedIndex());
                node.setLastIncludedTerm(leaderNode.getLastIncludedTerm());
                node.getLogEntries().clear();
                for (LogEntry entry : leaderNode.getLogEntries()) {
                    node.getLogEntries().add(new LogEntry(entry.getTerm(), entry.getKey(), entry.getValue()));
                }
                node.setCommitIndex(leaderNode.getLastIncludedIndex());
                leaderNode.getMatchIndex().put(node.getNodeId(), leaderNode.getLastLogIndex());
                leaderNode.getNextIndex().put(node.getNodeId(), leaderNode.getLogEntriesSize());
                node.setLastHeartbeatTime(currentTime);
                node.resetElectionTimeout();
                continue;
            }

            AppendEntriesRequest request =
                    new AppendEntriesRequest(

                            leaderNode.getCurrentTerm(),

                            leaderNode.getNodeId(),

                            prevLogIndex,

                            prevLogTerm,

                            entries,

                            leaderNode.getCommitIndex()
                    );

            AppendEntriesResponse response =
                    sendAppendEntries(node, request);

            // -----------------------------------------
            // VERY IMPORTANT
            // Leader steps down if follower has higher term
            // -----------------------------------------

            if (response.getTerm() > leaderNode.getCurrentTerm()) {

                System.out.println(
                        "\nHigher term discovered from "
                                + node.getNodeId());

                leaderNode.setCurrentTerm(response.getTerm());

                leaderNode.setCurrentState(NodeState.FOLLOWER);

                leaderNode.setVotedFor(null);

                leaderAlive = false;

                return;
            }

            if (response.isSuccess()) {

                leaderNode.getMatchIndex().put(
                        node.getNodeId(),
                        leaderNode.getLastLogIndex());

                leaderNode.getNextIndex().put(
                        node.getNodeId(),
                        leaderNode.getLogEntriesSize());

                node.setLastHeartbeatTime(currentTime);

                node.resetElectionTimeout();

                System.out.println(
                        "❤️ "
                                + node.getNodeId()
                                + " received heartbeat");
            }

            else {

                System.out.println(
                        node.getNodeId()
                        + " is behind. Starting catch-up..."
                );

                replicateToFollower(node);
            }
        }
    }

    @Scheduled(fixedRate = 1000)
    public void heartbeatTask() {

        if (leaderNode.getCurrentState() == NodeState.LEADER
                && leaderAlive
                && leaderNode.isOnline()) {

            sendHeartbeat();
        }

        long currentTime = System.currentTimeMillis();

        for (RaftNode node : cluster.getNodes()) {

            if (!node.isOnline()) {
                continue;
            }

            // Followers
            if (node.getCurrentState() == NodeState.FOLLOWER) {

                long elapsed =
                        currentTime - node.getLastHeartbeatTime();

                if (elapsed > node.getElectionTimeout()) {

                    System.out.println(
                            "\n⏰ " + node.getNodeId() + " timeout!"
                    );

                    startElection(node);
                }
            }

            // Candidates that lost election
            else if (node.getCurrentState() == NodeState.CANDIDATE) {

                long elapsed =
                        currentTime - node.getLastHeartbeatTime();

                if (elapsed > node.getElectionTimeout()) {

                    System.out.println(
                            node.getNodeId()
                                    + " election failed. Returning to FOLLOWER."
                    );

                    node.setCurrentState(NodeState.FOLLOWER);

                    node.setVotedFor(null);

                    node.resetElectionTimeout();

                    node.setLastHeartbeatTime(currentTime);
                }
            }
        }
    }

    private RequestVoteResponse sendRequestVote(
            RaftNode candidate,
            RaftNode follower,
            RequestVoteRequest request) {

            System.out.println(
                    "\nSending RequestVote RPC to " + follower.getNodeId()
        );

        if (!canCommunicate(candidate, follower)) {

            System.out.println(
                "RequestVote blocked by Network Partition."
            );

            return new RequestVoteResponse(
                    request.getTerm(),
                    false
            );
        }

        // Higher term discovered
        if (request.getTerm() > follower.getCurrentTerm()) {

            follower.setCurrentTerm(request.getTerm());

            follower.setCurrentState(NodeState.FOLLOWER);

            follower.setVotedFor(null);

            System.out.println(
                    follower.getNodeId()
                    + " updated to higher term "
                    + request.getTerm()
            );
        }

        // Reject lower term
        if (request.getTerm() < follower.getCurrentTerm()) {

            System.out.println("Vote Rejected : Older Term");

            return new RequestVoteResponse(
                    follower.getCurrentTerm(),
                    false
            );
        }

        // Candidate last log
        int candidateLastTerm = request.getLastLogTerm();
        int candidateLastIndex = request.getLastLogIndex();

        // Follower last log
        int followerLastIndex = follower.getLastLogIndex();

        int followerLastTerm = 0;

        if (followerLastIndex >= 0) {
            followerLastTerm = follower.getLogTerm(followerLastIndex);
        }

        // -------------------------------
        // Raft Log Freshness Check
        // -------------------------------

        boolean candidateLogUpToDate =

                candidateLastTerm > followerLastTerm ||

                (candidateLastTerm == followerLastTerm
                        && candidateLastIndex >= followerLastIndex);

        if (!candidateLogUpToDate) {

            System.out.println(
                    "Vote Rejected : Candidate log is outdated."
            );

            return new RequestVoteResponse(
                    follower.getCurrentTerm(),
                    false
            );
        }

        // Already voted?
        if (follower.getVotedFor() == null
                || follower.getVotedFor().equals(request.getCandidateId())) {

            follower.setVotedFor(request.getCandidateId());

            follower.setCurrentTerm(request.getTerm());

            follower.setLastHeartbeatTime(System.currentTimeMillis());

            follower.resetElectionTimeout();

            System.out.println(
                    follower.getNodeId()
                            + " voted for "
                            + request.getCandidateId()
            );

            return new RequestVoteResponse(
                    follower.getCurrentTerm(),
                    true
            );
        }

        System.out.println("Vote Rejected : Already voted.");

        return new RequestVoteResponse(
                follower.getCurrentTerm(),
                false
        );
    }

    public void startElection(RaftNode candidate) {

        if (!candidate.isOnline()) {
            return;
        }

        candidate.resetElectionTimeout();

        candidate.setCurrentTerm(candidate.getCurrentTerm() + 1);

        candidate.setCurrentState(NodeState.CANDIDATE);

        candidate.setVotesReceived(1);

        candidate.setVotedFor(candidate.getNodeId());

        System.out.println(candidate.getNodeId() + " became CANDIDATE");
        System.out.println(candidate.getNodeId() + " voted for itself");

        int lastLogIndex = candidate.getLastLogIndex();

        int lastLogTerm = 0;

        if (lastLogIndex >= 0) {
            lastLogTerm = candidate.getLogTerm(lastLogIndex);
        }

        for (RaftNode node : cluster.getNodes()) {

            if (node == candidate || !node.isOnline()) {
                continue;
            }

            RequestVoteRequest request = new RequestVoteRequest(
                    candidate.getCurrentTerm(),
                    candidate.getNodeId(),
                    lastLogIndex,
                    lastLogTerm
            );

            RequestVoteResponse response =
                    sendRequestVote(candidate, node, request);

            // ----------------------------
            // NEW: Higher term discovered
            // ----------------------------

            if (response.getTerm() > candidate.getCurrentTerm()) {

                candidate.setCurrentTerm(response.getTerm());

                candidate.setCurrentState(NodeState.FOLLOWER);

                candidate.setVotedFor(null);

                System.out.println(
                        candidate.getNodeId()
                                + " stepped down. Higher term discovered."
                );

                return;
            }

            if (response.isVoteGranted()) {

                candidate.setVotesReceived(
                        candidate.getVotesReceived() + 1
                );
            }
        }

        int majority = (cluster.getNodes().size() / 2) + 1;

        if (candidate.getVotesReceived() >= majority) {

            System.out.println(
                    "\n🏆 "
                            + candidate.getNodeId()
                            + " becomes NEW LEADER"
            );

            for (RaftNode node : cluster.getNodes()) {

                node.setCurrentState(NodeState.FOLLOWER);

                node.setVotesReceived(0);

                node.resetElectionTimeout();
            }

            candidate.setCurrentState(NodeState.LEADER);

            candidate.getNextIndex().clear();

            candidate.getMatchIndex().clear();

            for (RaftNode node : cluster.getNodes()) {

                if (node != candidate) {

                    candidate.getNextIndex().put(
                            node.getNodeId(),
                            candidate.getLogEntriesSize()
                    );

                    candidate.getMatchIndex().put(
                            node.getNodeId(),
                            -1
                    );
                }
            }

            leaderNode = candidate;

            leaderAlive = true;

            sendHeartbeat();
        }
    }


    public void disconnectFollower(String nodeId) {

        for (RaftNode node : cluster.getNodes()) {

            if (node.getNodeId().equals(nodeId)) {

                node.setOnline(false);

                System.out.println(nodeId + " is OFFLINE");

                if (node == leaderNode) {

                    leaderAlive = false;

                    System.out.println("Leader has gone OFFLINE.");
                }

                return;
            }
        }
    }

    public void reconnectFollower(String nodeId) {

        for (RaftNode node : cluster.getNodes()) {

            if (node.getNodeId().equals(nodeId)) {

                node.setOnline(true);

                System.out.println(nodeId + " is ONLINE");
                
                return;
            }
        }
    }

    public void synchronizeLogs(RaftNode follower) {

        System.out.println("\nSynchronizing logs with " + follower.getNodeId());

        int index = leaderNode.getLastLogIndex();

        while (index >= 0) {

            if (follower.hasMatchingLog(index, leaderNode.getLogTerm(index))) {
                break;
            }

            index--;
        }

        System.out.println("Last Matching Index : " + index);
        
        System.out.println("Removing conflicting logs...");

        follower.removeLogsFrom(index + 1);

        for (int i = index + 1; i < leaderNode.getLogEntriesSize(); i++) {

            LogEntry entry = leaderNode.getLogEntry(i);
            if (entry != null) {
                follower.addLogEntry(
                        new LogEntry(
                                entry.getTerm(),
                                entry.getKey(),
                                entry.getValue()
                        )
                );

                System.out.println(
                        "Replicated : "
                                + entry.getKey()
                                + " -> "
                                + entry.getValue()
                );
            }
        }

        System.out.println("Synchronization Completed.");
    }

    private boolean canCommunicate(RaftNode from, RaftNode to) {

        return from.isOnline()
                && to.isOnline()
                && from.canCommunicateWith(to.getNodeId())
                && to.canCommunicateWith(from.getNodeId());
    }

    public void createPartition(String nodeA, String nodeB) {

        RaftNode first = null;
        RaftNode second = null;

        for (RaftNode node : cluster.getNodes()) {

            if (node.getNodeId().equals(nodeA))
                first = node;

            if (node.getNodeId().equals(nodeB))
                second = node;
        }

        if (first == null || second == null)
            return;

        first.setCommunication(nodeB, false);
        second.setCommunication(nodeA, false);

        System.out.println(
                "\n🚧 Network Partition Created Between "
                        + nodeA + " and " + nodeB
        );
    }

    public void healPartition(String nodeA, String nodeB) {

        RaftNode first = null;
        RaftNode second = null;

        for (RaftNode node : cluster.getNodes()) {

            if (node.getNodeId().equals(nodeA))
                first = node;

            if (node.getNodeId().equals(nodeB))
                second = node;
        }

        if (first == null || second == null)
            return;

        first.setCommunication(nodeB, true);
        second.setCommunication(nodeA, true);

        System.out.println(
                "\n✅ Network Partition Healed Between "
                        + nodeA + " and " + nodeB
        );

        // No manual synchronization here.
        // The next heartbeat from the leader will automatically
        // trigger AppendEntries and replicateToFollower().
    }
    private void createSnapshot() {

        if (leaderNode.getCommitIndex() < SNAPSHOT_THRESHOLD) {
            return;
        }

        System.out.println("\n========== SNAPSHOT ==========");

        int snapshotIndex = leaderNode.getCommitIndex();

        lastIncludedIndex = snapshotIndex;

        lastIncludedTerm = leaderNode.getLogTerm(snapshotIndex);

        System.out.println(
                "Snapshot Created up to Index "
                        + lastIncludedIndex
        );

        leaderNode.createSnapshot(snapshotIndex);

        for (RaftNode node : cluster.getNodes()) {
            if (node == leaderNode) continue;
            if (node.isOnline() && node.getCommitIndex() >= snapshotIndex) {
                node.createSnapshot(snapshotIndex);
            }
        }

        for (RaftNode node : cluster.getNodes()) {

            if (node == leaderNode)
                continue;

            int currentNextIndex = leaderNode.getNextIndex()
                    .getOrDefault(node.getNodeId(), leaderNode.getLogEntriesSize());

            if (currentNextIndex <= leaderNode.getLastIncludedIndex()) {
                leaderNode.getNextIndex().put(
                        node.getNodeId(),
                        leaderNode.getLastIncludedIndex() + 1
                );
            }
        }

        System.out.println(
                "Old Logs Removed."
        );

        System.out.println(
                "Remaining Logs : "
                        + leaderNode.getLogEntries().size()
        );

        System.out.println("==============================");
    }

    public String getValue(String key) {

            return repository.findById(key)
                    .map(KeyValue::getValue)
                    .orElse("Key not found");
    }

    public String deleteKey(String key) {

        if (!repository.existsById(key)) {
            return "Key Not Found";
        }

        repository.deleteById(key);

        return "Deleted Successfully";
    }
}