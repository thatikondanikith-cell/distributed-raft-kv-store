package com.raft.backend.raft.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

    private boolean online = true;

    private Map<String, Integer> nextIndex;

    private Map<String, Integer> matchIndex;

    private Map<String, Boolean> communicationMap;

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
        this.nextIndex = new HashMap<>();
        this.matchIndex = new HashMap<>();
        this.communicationMap = new HashMap<>();
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

        if (!online) {
            return;
        }

        logEntries.add(logEntry);
    }

    public void resetElectionTimeout() {
        electionTimeout = ThreadLocalRandom.current().nextLong(3000, 6001);
    }

    public boolean isOnline() {
        return online;
    }

    public void setOnline(boolean online) {
        this.online = online;
    }

    public boolean hasMatchingLog(int index, int term) {

        if (index < 0) {
            return true;
        }

        if (index >= logEntries.size()) {
            return false;
        }

        return logEntries.get(index).getTerm() == term;
    }

    public void removeLogsFrom(int index) {

        while (logEntries.size() > index) {
            logEntries.remove(logEntries.size() - 1);
        }
    }

    public boolean canCommunicateWith(String nodeId) {

        return communicationMap.getOrDefault(nodeId, true);
    }

    public void setCommunication(String nodeId, boolean status) {

        communicationMap.put(nodeId, status);
    }

    public Map<String, Boolean> getCommunicationMap() {

        return communicationMap;
    }
    
    public Map<String, Integer> getNextIndex() {
        return nextIndex;
    }

    public void setNextIndex(Map<String, Integer> nextIndex) {
        this.nextIndex = nextIndex;
    }

    public Map<String, Integer> getMatchIndex() {
        return matchIndex;
    }

    public void setMatchIndex(Map<String, Integer> matchIndex) {
        this.matchIndex = matchIndex;
    }
}