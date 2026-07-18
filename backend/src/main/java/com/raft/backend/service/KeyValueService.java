package com.raft.backend.service;

import org.springframework.stereotype.Service;

import com.raft.backend.entity.KeyValue;
import com.raft.backend.raft.model.LogEntry;
import com.raft.backend.raft.service.RaftService;

@Service
public class KeyValueService {

    private final RaftService raftService;

    public KeyValueService(RaftService raftService) {
        this.raftService = raftService;
    }

    public void saveKeyValue(KeyValue keyValue) {

        LogEntry logEntry = new LogEntry(
                raftService.getRaftNode().getCurrentTerm(),
                keyValue.getKey(),
                keyValue.getValue()
        );

        raftService.appendLogEntry(logEntry);
    }
}