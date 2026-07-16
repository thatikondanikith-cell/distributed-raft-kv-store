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

    private final KeyValueService service;

    public KeyValueController(KeyValueService service) {
        this.service = service;
    }

    @PostMapping
    public KeyValue save(@RequestBody KeyValue keyValue) {
        return service.saveKeyValue(keyValue);
    }
}