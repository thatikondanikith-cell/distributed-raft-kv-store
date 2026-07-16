package com.raft.backend.raft.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.raft.backend.raft.model.LogEntry;
import com.raft.backend.raft.model.RaftCluster;
import com.raft.backend.raft.state.NodeState;

@Service
public class RaftService {

    private final RaftCluster cluster;

    private RaftNode leaderNode;

    private boolean leaderAlive = true;

    public RaftService() {

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

            if (!node.getNodeId().equals(leaderNode.getNodeId())) {

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

        long currentTime = System.currentTimeMillis();

        leaderNode.setLastHeartbeatTime(currentTime);

        System.out.println("\n❤️ Leader : " + leaderNode.getNodeId());

        for (RaftNode node : cluster.getNodes()) {

            if (!node.getNodeId().equals(leaderNode.getNodeId())) {

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

        if (leaderNode.getCurrentState() == NodeState.LEADER && leaderAlive) {
            sendHeartbeat();
        }

        long currentTime = System.currentTimeMillis();

        for (RaftNode node : cluster.getNodes()) {

            if (node.getCurrentState() == NodeState.FOLLOWER) {

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

        candidate.resetElectionTimeout();

        candidate.setCurrentState(NodeState.CANDIDATE);
        candidate.setCurrentTerm(candidate.getCurrentTerm() + 1);
        candidate.setVotesReceived(1);
        candidate.setVotedFor(candidate.getNodeId());

        System.out.println(candidate.getNodeId() + " became CANDIDATE");
        System.out.println(candidate.getNodeId() + " voted for itself");

        for (RaftNode node : cluster.getNodes()) {

            if (!node.getNodeId().equals(candidate.getNodeId())) {

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
            }

            candidate.setCurrentState(NodeState.LEADER);

            leaderNode = candidate;

            leaderAlive = true;

            sendHeartbeat();
        }
    }

    public void crashLeader() {

        leaderAlive = false;

        System.out.println(
                "\n💥 " +
                leaderNode.getNodeId() +
                " crashed!"
        );
    }
}