package com.raft.backend.raft.service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import com.raft.backend.raft.model.LogEntry;
import com.raft.backend.raft.state.NodeState;

public class RaftNode {

    private final String nodeId;

    private int currentTerm;

    private String votedFor;

    private NodeState currentState;

    private int commitIndex;

    private int votesReceived;

    private long lastHeartbeatTime;

    private long electionTimeout;

    private final List<LogEntry> logEntries;

    public RaftNode(String nodeId) {

        this.nodeId = nodeId;
        this.currentTerm = 0;
        this.votedFor = null;
        this.currentState = NodeState.FOLLOWER;
        this.commitIndex = -1;
        this.votesReceived = 0;
        this.lastHeartbeatTime = System.currentTimeMillis();

        // Random timeout between 3000 and 6000 milliseconds
        this.electionTimeout = ThreadLocalRandom.current().nextLong(3000, 6001);

        this.logEntries = new ArrayList<>();
    }

    public String getNodeId() {
        return nodeId;
    }

    public int getCurrentTerm() {
        return currentTerm;
    }

    public void setCurrentTerm(int currentTerm) {
        this.currentTerm = currentTerm;
    }

    public String getVotedFor() {
        return votedFor;
    }

    public void setVotedFor(String votedFor) {
        this.votedFor = votedFor;
    }

    public NodeState getCurrentState() {
        return currentState;
    }

    public void setCurrentState(NodeState currentState) {
        this.currentState = currentState;
    }

    public int getCommitIndex() {
        return commitIndex;
    }

    public void setCommitIndex(int commitIndex) {
        this.commitIndex = commitIndex;
    }

    public int getVotesReceived() {
        return votesReceived;
    }

    public void setVotesReceived(int votesReceived) {
        this.votesReceived = votesReceived;
    }

    public long getLastHeartbeatTime() {
        return lastHeartbeatTime;
    }

    public void setLastHeartbeatTime(long lastHeartbeatTime) {
        this.lastHeartbeatTime = lastHeartbeatTime;
    }

    public long getElectionTimeout() {
        return electionTimeout;
    }

    public void setElectionTimeout(long electionTimeout) {
        this.electionTimeout = electionTimeout;
    }

    public List<LogEntry> getLogEntries() {
        return logEntries;
    }

    public void addLogEntry(LogEntry logEntry) {
        logEntries.add(logEntry);
    }

    public void resetElectionTimeout() {
        electionTimeout = ThreadLocalRandom.current().nextLong(3000, 6001);
    }
}