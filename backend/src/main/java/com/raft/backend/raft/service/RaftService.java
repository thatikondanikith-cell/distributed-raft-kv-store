package com.raft.backend.raft.service;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.raft.backend.raft.model.LogEntry;
import com.raft.backend.raft.model.RaftCluster;
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

            if (!node.getNodeId().equals(leaderNode.getNodeId()) && node.isOnline()) {

                System.out.println(
                        "\nReplicating log to " +
                        node.getNodeId()
                );

                node.addLogEntry(
                        new LogEntry(
                                logEntry.getTerm(),
                                logEntry.getKey(),
                                logEntry.getValue()
                        )
                );

                ackCount++;

                System.out.println(
                        node.getNodeId() +
                        " ACK received."
                );
            }
        }

        System.out.println("\nACK Count : " + ackCount);

        int majority = (cluster.getNodes().size() / 2) + 1;

        if (ackCount >= majority) {

            System.out.println("Majority Achieved.");

            leaderNode.setCommitIndex(
                    leaderNode.getCommitIndex() + 1
            );

            System.out.println(
                    "Commit Index = " +
                    leaderNode.getCommitIndex()
            );

            System.out.println(
                    "Log Committed Successfully."
            );
            System.out.println("Applying to State Machine...");

            stateMachineService.apply(logEntry);

            System.out.println("Applied Successfully.");

        } else {

            System.out.println(
                    "Majority NOT achieved."
            );
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

            if (!node.getNodeId().equals(leaderNode.getNodeId())
                    && node.isOnline()) {

                node.setLastHeartbeatTime(currentTime);

                node.resetElectionTimeout();

                System.out.println(
                        "❤️ " +
                        node.getNodeId() +
                        " received heartbeat"
                );
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

    public void startElection(RaftNode candidate) {

        if (!candidate.isOnline()) {
            return;
        }

        candidate.resetElectionTimeout();

        candidate.setCurrentState(NodeState.CANDIDATE);
        candidate.setCurrentTerm(candidate.getCurrentTerm() + 1);
        candidate.setVotesReceived(1);
        candidate.setVotedFor(candidate.getNodeId());

        System.out.println(candidate.getNodeId() + " became CANDIDATE");
        System.out.println(candidate.getNodeId() + " voted for itself");

        for (RaftNode node : cluster.getNodes()) {

            if (!node.getNodeId().equals(candidate.getNodeId())
                && node.isOnline()) {

                if (node.getVotedFor() == null
                        || node.getCurrentTerm() < candidate.getCurrentTerm()) {

                    node.setVotedFor(candidate.getNodeId());

                    candidate.setVotesReceived(
                            candidate.getVotesReceived() + 1
                    );

                    System.out.println(
                            node.getNodeId() +
                            " voted for " +
                            candidate.getNodeId()
                    );
                }
            }
        }

        if (candidate.getVotesReceived() >= 2) {

            System.out.println(
                    "\n🏆 " +
                    candidate.getNodeId() +
                    " becomes NEW LEADER"
            );

            for (RaftNode node : cluster.getNodes()) {

                node.setCurrentState(NodeState.FOLLOWER);

                node.setVotesReceived(0);

                node.setVotedFor(null);

                node.resetElectionTimeout();
            }

            candidate.setCurrentState(NodeState.LEADER);

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

                if (node != leaderNode) {
                    synchronizeLogs(node);
                }

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
}