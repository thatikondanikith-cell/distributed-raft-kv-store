package com.raft.backend.raft.service;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.raft.backend.raft.model.AppendEntriesRequest;
import com.raft.backend.raft.model.AppendEntriesResponse;
import com.raft.backend.raft.model.LogEntry;
import com.raft.backend.raft.model.RaftCluster;
import com.raft.backend.raft.model.RequestVoteRequest;
import com.raft.backend.raft.model.RequestVoteResponse;
import com.raft.backend.raft.state.NodeState;
import com.raft.backend.service.StateMachineService;

@Service
public class RaftService {

    private final RaftCluster cluster;

    private RaftNode leaderNode;

    private boolean leaderAlive = true;
    private final StateMachineService stateMachineService;

    public RaftService(StateMachineService stateMachineService) {

        this.stateMachineService = stateMachineService;

        cluster = new RaftCluster();

        RaftNode node1 = new RaftNode("Node-1");
        RaftNode node2 = new RaftNode("Node-2");
        RaftNode node3 = new RaftNode("Node-3");

        cluster.addNode(node1);
        cluster.addNode(node2);
        cluster.addNode(node3);

        leaderNode = node1;
    }

    public RaftCluster getCluster() {
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
                    follower.getCurrentTerm(),
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
        if (request.getPrevLogIndex() >= follower.getLogEntries().size()) {

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

            int followerPrevTerm =
                    follower.getLogEntries()
                            .get(request.getPrevLogIndex())
                            .getTerm();

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

        if (!request.getEntries().isEmpty()) {

            while (follower.getLogEntries().size() > request.getPrevLogIndex() + 1) {

                follower.getLogEntries()
                        .remove(follower.getLogEntries().size() - 1);
            }

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

        follower.setCommitIndex(
                Math.min(
                        request.getLeaderCommit(),
                        follower.getLogEntries().size() - 1
                )
        );

        follower.setLastHeartbeatTime(System.currentTimeMillis());

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

    private boolean replicateToFollower(RaftNode follower, LogEntry logEntry) {

        while (true) {

            int nextIndex =
                    leaderNode.getNextIndex().get(follower.getNodeId());

            int prevLogIndex = nextIndex - 1;

            int prevLogTerm = 0;

            if (prevLogIndex >= 0) {

                prevLogTerm =
                        leaderNode.getLogEntries()
                                .get(prevLogIndex)
                                .getTerm();
            }

            AppendEntriesRequest request =
                    new AppendEntriesRequest(

                            leaderNode.getCurrentTerm(),

                            leaderNode.getNodeId(),

                            prevLogIndex,

                            prevLogTerm,

                            leaderNode.getLogEntries().subList(
                                    nextIndex,
                                    leaderNode.getLogEntries().size()
                            ),

                            leaderNode.getCommitIndex()
                    );

            AppendEntriesResponse response =
                    sendAppendEntries(follower, request);

            if (response.isSuccess()) {

                leaderNode.getNextIndex().put(
                        follower.getNodeId(),
                        leaderNode.getLogEntries().size()
                );

                leaderNode.getMatchIndex().put(
                        follower.getNodeId(),
                        leaderNode.getLogEntries().size() - 1
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

                leaderAlive = false;

                System.out.println(
                        leaderNode.getNodeId()
                                + " stepped down. Higher term discovered."
                );

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
                    "Retrying with nextIndex = "
                            + (nextIndex - 1)
            );
        }
    }

    private void updateCommitIndex() {

        int lastLogIndex = leaderNode.getLogEntries().size() - 1;

        for (int index = lastLogIndex;
            index > leaderNode.getCommitIndex();
            index--) {

            // Raft Rule:
            // Only commit entries from CURRENT TERM

            if (leaderNode.getLogEntries()
                    .get(index)
                    .getTerm() != leaderNode.getCurrentTerm()) {

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
                leaderNode.getNodeId() +
                " appended log locally."
        );

        // Leader already has the log
        int ackCount = 1;

        for (RaftNode node : cluster.getNodes()) {

            if (!node.getNodeId().equals(leaderNode.getNodeId())
                    && node.isOnline()) {

                if (replicateToFollower(node, logEntry)) {

                    ackCount++;

                    System.out.println(
                            node.getNodeId() +
                            " ACK received."
                    );
                }
            }
        }

        System.out.println("\nACK Count : " + ackCount);

        updateCommitIndex();

        if (leaderNode.getCommitIndex() ==
                leaderNode.getLogEntries().size() - 1) {

            System.out.println("Majority Achieved.");

            System.out.println(
                    "Commit Index = "
                            + leaderNode.getCommitIndex()
            );

            System.out.println("Applying to State Machine...");

            stateMachineService.apply(logEntry);

            System.out.println("Applied Successfully.");

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
                        leaderNode.getLogEntries().size()
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

            // Skip offline followers
            if (!node.isOnline()) {
                continue;
            }

            // Then check network partition
            if (!canCommunicate(leaderNode, node)) {

                System.out.println(
                        "Heartbeat blocked by Network Partition to "
                        + node.getNodeId()
                );

                continue;
            }

            int prevLogIndex = leaderNode.getLogEntries().size() - 1;

            int prevLogTerm = 0;

            if (prevLogIndex >= 0) {

                prevLogTerm =
                        leaderNode.getLogEntries()
                                .get(prevLogIndex)
                                .getTerm();
            }

            AppendEntriesRequest heartbeatRequest =
                    new AppendEntriesRequest(

                            leaderNode.getCurrentTerm(),

                            leaderNode.getNodeId(),

                            prevLogIndex,

                            prevLogTerm,

                            List.of(),

                            leaderNode.getCommitIndex()
                    );

            AppendEntriesResponse response =
                    sendAppendEntries(node, heartbeatRequest);

            if (response.isSuccess()) {

                node.setLastHeartbeatTime(currentTime);

                node.resetElectionTimeout();

                System.out.println(
                        "❤️ " + node.getNodeId()
                                + " received heartbeat"
                );
            }

            // ---------------------------------
            // NEW PART
            // ---------------------------------

            Integer nextIndex =
                    leaderNode.getNextIndex().get(node.getNodeId());

            if (nextIndex == null) {
                continue;
            }

            if (nextIndex < leaderNode.getLogEntries().size()) {

                System.out.println(
                        node.getNodeId() +
                        " is behind. Starting replication..."
                );

                while (leaderNode.getNextIndex().get(node.getNodeId())
                        < leaderNode.getLogEntries().size()) {

                    int index = leaderNode.getNextIndex().get(node.getNodeId());

                    LogEntry entry =
                            leaderNode.getLogEntries().get(index);

                    boolean success =
                            replicateToFollower(node, entry);

                    if (!success) {
                        break;
                    }
                }
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

            if (node.isOnline()
        && node.getCurrentState() == NodeState.FOLLOWER) {

                long elapsed =
                        currentTime - node.getLastHeartbeatTime();

                if (elapsed > node.getElectionTimeout()) {

                    System.out.println(
                            "\n⏰ " +
                            node.getNodeId() +
                            " timeout!"
                    );

                    startElection(node);

                    break;
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
                    follower.getCurrentTerm(),
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
        int followerLastIndex = follower.getLogEntries().size() - 1;

        int followerLastTerm = 0;

        if (followerLastIndex >= 0) {
            followerLastTerm = follower.getLogEntries()
                    .get(followerLastIndex)
                    .getTerm();
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

        int lastLogIndex = candidate.getLogEntries().size() - 1;

        int lastLogTerm = 0;

        if (lastLogIndex >= 0) {
            lastLogTerm = candidate.getLogEntries()
                    .get(lastLogIndex)
                    .getTerm();
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
                            candidate.getLogEntries().size()
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

        List<LogEntry> leaderLogs = leaderNode.getLogEntries();

        int index = leaderLogs.size() - 1;

        while (index >= 0) {

            LogEntry leaderEntry = leaderLogs.get(index);

            if (follower.hasMatchingLog(index, leaderEntry.getTerm())) {
                break;
            }

            index--;
        }

        System.out.println("Last Matching Index : " + index);
        
        System.out.println("Removing conflicting logs...");

        follower.removeLogsFrom(index + 1);

        for (int i = index + 1; i < leaderLogs.size(); i++) {

            LogEntry entry = leaderLogs.get(i);

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
    }
}