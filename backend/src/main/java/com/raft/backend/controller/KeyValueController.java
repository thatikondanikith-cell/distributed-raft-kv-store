package com.raft.backend.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.raft.backend.entity.KeyValue;
import com.raft.backend.service.KeyValueService;

@RestController
@RequestMapping("/api/kv")
public class KeyValueController {

    private final KeyValueService keyValueService;

    public KeyValueController(KeyValueService keyValueService) {
        this.keyValueService = keyValueService;
    }

    @PostMapping("/put")
    public String put(@RequestBody KeyValue keyValue) {

        keyValueService.saveKeyValue(keyValue);

        return "Request sent to Raft successfully.";
    }
}