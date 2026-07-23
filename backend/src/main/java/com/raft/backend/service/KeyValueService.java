package com.raft.backend.service;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.ArrayList;

import com.raft.backend.entity.KeyValue;
import com.raft.backend.raft.model.LogEntry;
import com.raft.backend.raft.service.RaftService;
import com.raft.backend.repository.KeyValueRepository;

@Service
public class KeyValueService {

    private final RaftService raftService;
    private final KeyValueRepository repository;

    public KeyValueService(RaftService raftService, KeyValueRepository repository) {
        this.raftService = raftService;
        this.repository = repository;
    }

    public void saveKeyValue(KeyValue keyValue) {

        // Capture which node is currently the leader at write time.
        // nodeId format is "node-1" → display name is "Node 1"
        String rawNodeId = raftService.getRaftNode().getNodeId();
        String leaderName = rawNodeId.substring(0, 1).toUpperCase()
                + rawNodeId.substring(1).replace("-", " ");

        LogEntry logEntry = new LogEntry(
                raftService.getRaftNode().getCurrentTerm(),
                keyValue.getKey(),
                keyValue.getValue(),
                leaderName
        );

        raftService.appendLogEntry(logEntry);
    }

    public List<KeyValue> findAllForUser(String email) {
        List<KeyValue> all = repository.findAll();
        List<KeyValue> userKeys = new ArrayList<>();
        String prefix = email + ":";
        for (KeyValue kv : all) {
            if (kv.getKey() != null && kv.getKey().startsWith(prefix)) {
                String cleanKey = kv.getKey().substring(prefix.length());
                KeyValue clean = new KeyValue(cleanKey, kv.getValue(), kv.getWrittenByLeader());
                userKeys.add(clean);
            }
        }
        return userKeys;
    }
}