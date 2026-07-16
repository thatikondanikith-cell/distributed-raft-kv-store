package com.raft.backend.raft.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.raft.backend.raft.model.LogEntry;
import com.raft.backend.raft.model.RaftCluster;
import com.raft.backend.raft.service.RaftService;

@RestController
@RequestMapping("/api/raft")
public class RaftController {

    private final RaftService raftService;

    public RaftController(RaftService raftService) {
        this.raftService = raftService;
    }

    @GetMapping("/status")
    public Object getStatus() {
        return raftService.getRaftNode();
    }

    @GetMapping("/cluster")
    public RaftCluster getCluster() {
        return raftService.getCluster();
    }

    @PostMapping("/leader")
    public String becomeLeader() {
        raftService.becomeLeader();
        return "Node became Leader";
    }

    @PostMapping("/log")
    public String appendLog() {

        LogEntry logEntry = new LogEntry(
                raftService.getRaftNode().getCurrentTerm(),
                "sampleKey",
                "sampleValue"
        );

        raftService.appendLogEntry(logEntry);

        return "Log Entry Added";
    }

    @PostMapping("/crash")
    public String crashLeader() {

        raftService.crashLeader();

        return "Leader crashed successfully.";
    }
}