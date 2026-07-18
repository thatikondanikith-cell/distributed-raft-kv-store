package com.raft.backend.service;

import org.springframework.stereotype.Service;

import com.raft.backend.entity.KeyValue;
import com.raft.backend.raft.model.LogEntry;
import com.raft.backend.repository.KeyValueRepository;

@Service
public class StateMachineService {

    private final KeyValueRepository repository;

    public StateMachineService(KeyValueRepository repository) {
        this.repository = repository;
    }

    public void apply(LogEntry logEntry) {

        KeyValue keyValue = new KeyValue(
                logEntry.getKey(),
                logEntry.getValue()
        );

        repository.save(keyValue);

        System.out.println(
                "State Machine Applied : "
                        + logEntry.getKey()
                        + " = "
                        + logEntry.getValue()
        );
    }
}