package com.raft.backend.raft.service;

import java.util.ArrayList;
import java.util.List;

import com.raft.backend.raft.model.LogEntry;
import com.raft.backend.raft.state.NodeState;

public class RaftNode {

    private String nodeId;

    private NodeState currentState;

    private int currentTerm;

    // Stores all log entries of this node
    private List<LogEntry> logEntries;

    public RaftNode(String nodeId) {
        this.nodeId = nodeId;
        this.currentState = NodeState.FOLLOWER;
        this.currentTerm = 0;
        this.logEntries = new ArrayList<>();
    }

    public String getNodeId() {
        return nodeId;
    }

    public NodeState getCurrentState() {
        return currentState;
    }

    public void setCurrentState(NodeState currentState) {
        this.currentState = currentState;
    }

    public int getCurrentTerm() {
        return currentTerm;
    }

    public void setCurrentTerm(int currentTerm) {
        this.currentTerm = currentTerm;
    }

    public List<LogEntry> getLogEntries() {
        return logEntries;
    }

    public void setLogEntries(List<LogEntry> logEntries) {
        this.logEntries = logEntries;
    }

    // NEW: Add a log entry to this node
    public void addLogEntry(LogEntry logEntry) {
        this.logEntries.add(logEntry);
    }
}