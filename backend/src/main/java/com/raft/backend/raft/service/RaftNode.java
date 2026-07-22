package com.raft.backend.raft.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.raft.backend.raft.model.LogEntry;
import com.raft.backend.raft.state.NodeState;

public class RaftNode {

    private static final Logger log = LoggerFactory.getLogger(RaftNode.class);

    private final String nodeId;

    private int currentTerm;

    private String votedFor;

    private NodeState currentState;

    private int commitIndex;

    private int votesReceived;

    private long lastHeartbeatTime;

    private long electionTimeout;

    private boolean online = true;

    // =========================================================
    // ADAPTIVE ELECTION TIMEOUT - EWMA based self-tuning
    // Tracks heartbeat inter-arrival time and jitter so each
    // node independently adapts its timeout to network conditions
    // =========================================================

    private long lastHeartbeatArrivalTime = -1;

    // Exponential Weighted Moving Average of heartbeat interval
    private double avgInterval = 4500.0;

    // EWMA of absolute deviation from mean (jitter)
    private double jitter = 500.0;

    // Safety floor and ceiling (ms)
    private static final long MIN_ELECTION_TIMEOUT = 1500;
    private static final long MAX_ELECTION_TIMEOUT = 12000;

    private Map<String, Integer> nextIndex;

    private Map<String, Integer> matchIndex;

    private Map<String, Boolean> communicationMap;

    private final List<LogEntry> logEntries;

    private int lastIncludedIndex = -1;

    private int lastIncludedTerm = 0;

    public RaftNode(String nodeId) {

        this.nodeId = nodeId;
        this.currentTerm = 0;
        this.votedFor = null;
        this.currentState = NodeState.FOLLOWER;
        this.commitIndex = -1;
        this.votesReceived = 0;
        this.lastHeartbeatTime = System.currentTimeMillis();

        // Adaptive initial timeout: starts at a reasonable default
        this.electionTimeout = ThreadLocalRandom.current().nextLong(3000, 6001);

        this.logEntries = new ArrayList<>();
        this.nextIndex = new HashMap<>();
        this.matchIndex = new HashMap<>();
        this.communicationMap = new HashMap<>();
        this.lastIncludedIndex = -1;
        this.lastIncludedTerm = 0;
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

    // =========================================================
    // Records heartbeat arrival and updates EWMA statistics.
    // Called every time a valid heartbeat or AppendEntries is
    // accepted from the leader.
    // =========================================================
    public void recordHeartbeatArrival() {

        long now = System.currentTimeMillis();

        if (lastHeartbeatArrivalTime != -1) {

            long interval = now - lastHeartbeatArrivalTime;

            // EWMA smoothing factors:
            // alpha = 0.125 (slow smooth for average, stable estimate)
            // beta  = 0.25  (faster track for jitter, reacts quicker)
            avgInterval = (0.875 * avgInterval) + (0.125 * interval);
            jitter      = (0.75  * jitter)      + (0.25  * Math.abs(interval - avgInterval));

            log.debug("[AdaptiveTimeout] {} | interval={}ms avgInterval={:.0f}ms jitter={:.0f}ms",
                nodeId, interval, avgInterval, jitter);
        }

        lastHeartbeatArrivalTime = now;
    }

    // =========================================================
    // Computes adaptive election timeout from EWMA statistics.
    // Formula: base = avg + 4 * jitter, then randomized by +2s
    // Higher jitter = larger timeout = more tolerance for flaky nets
    // Lower jitter  = smaller timeout = faster leader failure detect
    // =========================================================
    public void resetElectionTimeout() {

        long base = (long) (avgInterval + 4.0 * jitter);

        // Safety clamp: never below 1500ms, never above 12000ms
        base = Math.max(MIN_ELECTION_TIMEOUT, Math.min(base, MAX_ELECTION_TIMEOUT));

        // Add randomness within [base, base + 2000] to break ties
        electionTimeout = ThreadLocalRandom.current().nextLong(base, base + 2001);

        log.debug("[AdaptiveTimeout] {} | new electionTimeout={}ms", nodeId, electionTimeout);
    }

    public boolean isOnline() {
        return online;
    }

    public void setOnline(boolean online) {
        this.online = online;
    }

    public int getLastIncludedIndex() {
        return lastIncludedIndex;
    }

    public void setLastIncludedIndex(int lastIncludedIndex) {
        this.lastIncludedIndex = lastIncludedIndex;
    }

    public int getLastIncludedTerm() {
        return lastIncludedTerm;
    }

    public void setLastIncludedTerm(int lastIncludedTerm) {
        this.lastIncludedTerm = lastIncludedTerm;
    }

    public int getLogEntriesSize() {
        return lastIncludedIndex + 1 + logEntries.size();
    }

    public LogEntry getLogEntry(int absoluteIndex) {
        int localIndex = absoluteIndex - lastIncludedIndex - 1;
        if (localIndex >= 0 && localIndex < logEntries.size()) {
            return logEntries.get(localIndex);
        }
        return null;
    }

    public int getLogTerm(int absoluteIndex) {
        if (absoluteIndex == lastIncludedIndex) {
            return lastIncludedTerm;
        }
        LogEntry entry = getLogEntry(absoluteIndex);
        return entry != null ? entry.getTerm() : 0;
    }

    public int getLastLogIndex() {
        return getLogEntriesSize() - 1;
    }

    public int getLastLogTerm() {
        int lastIndex = getLastLogIndex();
        return getLogTerm(lastIndex);
    }

    public List<LogEntry> getLogEntriesSubList(int absoluteStartIndex) {
        int localIndex = absoluteStartIndex - lastIncludedIndex - 1;
        if (localIndex < 0) {
            return null; // Lagging behind snapshot boundary
        }
        if (localIndex > logEntries.size()) {
            return new ArrayList<>();
        }
        return logEntries.subList(localIndex, logEntries.size());
    }

    public void createSnapshot(int snapshotIndex) {
        if (snapshotIndex <= lastIncludedIndex || snapshotIndex >= getLogEntriesSize()) {
            return;
        }
        lastIncludedTerm = getLogTerm(snapshotIndex);
        int localIndexToClear = snapshotIndex - lastIncludedIndex - 1;
        if (localIndexToClear >= 0 && localIndexToClear < logEntries.size()) {
            logEntries.subList(0, localIndexToClear + 1).clear();
        }
        lastIncludedIndex = snapshotIndex;
        if (commitIndex < snapshotIndex) {
            commitIndex = snapshotIndex;
        }
    }

    public boolean hasMatchingLog(int absoluteIndex, int term) {
        if (absoluteIndex < 0) {
            return true;
        }
        if (absoluteIndex == lastIncludedIndex) {
            return lastIncludedTerm == term;
        }
        if (absoluteIndex < lastIncludedIndex) {
            return true; // Already committed/snapshotted match
        }
        LogEntry entry = getLogEntry(absoluteIndex);
        return entry != null && entry.getTerm() == term;
    }

    public void removeLogsFrom(int absoluteIndex) {
        int localIndex = absoluteIndex - lastIncludedIndex - 1;
        if (localIndex < 0) {
            logEntries.clear();
            return;
        }
        while (logEntries.size() > localIndex) {
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