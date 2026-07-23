package com.raft.backend.raft.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;

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

    

    @PostMapping("/offline/{nodeId}")
    public String offline(@PathVariable String nodeId) {

        raftService.disconnectFollower(nodeId);

        return nodeId + " disconnected.";
    }

    @PostMapping("/online/{nodeId}")
    public String online(@PathVariable String nodeId) {

        raftService.reconnectFollower(nodeId);

        return nodeId + " reconnected.";
    }

    @PostMapping("/election/{nodeId}")
    public String startElection(@PathVariable String nodeId) {
        for (com.raft.backend.raft.service.RaftNode node : raftService.getCluster().getNodes()) {
            if (node.getNodeId().equalsIgnoreCase(nodeId)) {
                raftService.startElection(node);
                return nodeId + " started election.";
            }
        }
        return "Node " + nodeId + " not found.";
    }

    @PostMapping("/partition/{nodeA}/{nodeB}")
    public String partition(
            @PathVariable String nodeA,
            @PathVariable String nodeB) {

        raftService.createPartition(nodeA, nodeB);

        return "Partition created between "
                + nodeA
                + " and "
                + nodeB;
    }

    @PostMapping("/heal/{nodeA}/{nodeB}")
    public String heal(
            @PathVariable String nodeA,
            @PathVariable String nodeB) {

        raftService.healPartition(nodeA, nodeB);

        return "Partition healed between "
                + nodeA
                + " and "
                + nodeB;
    }

    @GetMapping("/get/{key}")
    public String getValue(@PathVariable String key, HttpServletRequest request) {
        String email = (String) request.getAttribute("authenticatedEmail");
        String prefixedKey = email + ":" + key;
        return raftService.getValue(prefixedKey);
    }

    @DeleteMapping("/delete/{key}")
    public String deleteKey(@PathVariable String key, HttpServletRequest request) {
        String email = (String) request.getAttribute("authenticatedEmail");
        String prefixedKey = email + ":" + key;

        LogEntry logEntry = new LogEntry(
                raftService.getRaftNode().getCurrentTerm(),
                prefixedKey,
                "__DELETE__"
        );

        raftService.appendLogEntry(logEntry);

        return key + " scheduled for deletion.";
    }
}