package com.raft.backend.raft.service;

import org.springframework.stereotype.Service;

import com.raft.backend.raft.model.LogEntry;
import com.raft.backend.raft.state.NodeState;

@Service
public class RaftService {

    private final RaftNode raftNode;

    public RaftService() {
        this.raftNode = new RaftNode("Node-1");
    }

    public void appendLogEntry(LogEntry logEntry) {
        raftNode.addLogEntry(logEntry);
    }

    public RaftNode getRaftNode() {
        return raftNode;
    }

    // NEW: Become Leader
    public void becomeLeader() {
        raftNode.setCurrentState(NodeState.LEADER);
        raftNode.setCurrentTerm(raftNode.getCurrentTerm() + 1);
    }

    // NEW: Become Follower
    public void becomeFollower() {
        raftNode.setCurrentState(NodeState.FOLLOWER);
    }
}