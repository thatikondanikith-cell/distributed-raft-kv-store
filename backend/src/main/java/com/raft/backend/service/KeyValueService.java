package com.raft.backend.service;

import org.springframework.stereotype.Service;

import com.raft.backend.entity.KeyValue;
import com.raft.backend.raft.model.LogEntry;
import com.raft.backend.raft.service.RaftService;
import com.raft.backend.repository.KeyValueRepository;

@Service
public class KeyValueService {

    private final KeyValueRepository repository;
    private final RaftService raftService;

    public KeyValueService(KeyValueRepository repository, RaftService raftService) {
        this.repository = repository;
        this.raftService = raftService;
    }

    public KeyValue saveKeyValue(KeyValue keyValue) {

        // Step 1: Create a Raft Log Entry
        LogEntry logEntry = new LogEntry(
                raftService.getRaftNode().getCurrentTerm(),
                keyValue.getKey(),
                keyValue.getValue()
        );

        // Step 2: Append it to the Raft Log
        raftService.appendLogEntry(logEntry);

        // Step 3: Save to MySQL
        return repository.save(keyValue);
    }
}