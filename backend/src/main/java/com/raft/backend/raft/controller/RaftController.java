package com.raft.backend.raft.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import com.raft.backend.raft.model.LogEntry;
import com.raft.backend.raft.service.RaftNode;
import com.raft.backend.raft.service.RaftService;

@RestController
public class RaftController {

    private final RaftService raftService;

    public RaftController(RaftService raftService) {
        this.raftService = raftService;
    }

    @GetMapping("/api/raft/logs")
    public List<LogEntry> getLogs() {
        return raftService.getRaftNode().getLogEntries();
    }

    // NEW: Make this node the leader
    @PostMapping("/api/raft/leader")
    public String becomeLeader() {
        raftService.becomeLeader();
        return "Node became LEADER";
    }

    // NEW: View node status
    @GetMapping("/api/raft/status")
    public RaftNode getStatus() {
        return raftService.getRaftNode();
    }
}