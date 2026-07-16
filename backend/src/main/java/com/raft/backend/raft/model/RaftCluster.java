package com.raft.backend.raft.model;

import java.util.ArrayList;
import java.util.List;

import com.raft.backend.raft.service.RaftNode;

public class RaftCluster {

    private List<RaftNode> nodes = new ArrayList<>();

    public List<RaftNode> getNodes() {
        return nodes;
    }

    public void setNodes(List<RaftNode> nodes) {
        this.nodes = nodes;
    }

    public void addNode(RaftNode node) {
        nodes.add(node);
    }
}