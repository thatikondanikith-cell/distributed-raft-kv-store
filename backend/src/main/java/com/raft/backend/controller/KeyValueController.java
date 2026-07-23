package com.raft.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

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
    public String put(@RequestBody KeyValue keyValue, HttpServletRequest request) {
        String email = (String) request.getAttribute("authenticatedEmail");
        String prefixedKey = email + ":" + keyValue.getKey();
        keyValue.setKey(prefixedKey);
        keyValueService.saveKeyValue(keyValue);

        return "Request sent to Raft successfully.";
    }

    @GetMapping("/list")
    public List<KeyValue> list(HttpServletRequest request) {
        String email = (String) request.getAttribute("authenticatedEmail");
        return keyValueService.findAllForUser(email);
    }
}