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

        // Step 1: Create a Raft log entry
        LogEntry logEntry = new LogEntry(
                raftService.getRaftNode().getCurrentTerm(),
                keyValue.getKey(),
                keyValue.getValue());

        // Step 2: Add it to the Raft log
        raftService.appendLogEntry(logEntry);

        // Step 3: For now, save directly to MySQL
        // Later, this will happen only after a majority commit.
        return repository.save(keyValue);
    }
}