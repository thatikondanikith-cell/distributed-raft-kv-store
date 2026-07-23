package com.raft.backend.service;

import java.util.Optional;

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

    // ==========================
    // APPLY (PUT)
    // ==========================

    public void apply(LogEntry logEntry) {

        if ("__DELETE__".equals(logEntry.getValue())) {

            repository.deleteById(logEntry.getKey());

            System.out.println(
                    "State Machine Deleted : "
                            + logEntry.getKey()
            );

            return;
        }

        KeyValue keyValue = new KeyValue(
                logEntry.getKey(),
                logEntry.getValue(),
                logEntry.getLeaderName()
        );

        repository.save(keyValue);

        System.out.println(
                "State Machine Applied : "
                        + logEntry.getKey()
                        + " = "
                        + logEntry.getValue()
        );
    }

    // ==========================
    // GET
    // ==========================

    public String getValue(String key) {

        Optional<KeyValue> keyValue =
                repository.findById(key);

        if (keyValue.isPresent()) {

            return keyValue.get().getValue();
        }

        return null;
    }
}