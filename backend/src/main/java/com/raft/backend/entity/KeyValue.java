package com.raft.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "key_value_store")
public class KeyValue {

    @Id
    @Column(name = "kv_key")
    private String key;

    @Column(name = "kv_value")
    private String value;

    @Column(name = "written_by_leader")
    private String writtenByLeader;

    public KeyValue() {
    }

    public KeyValue(String key, String value) {
        this.key = key;
        this.value = value;
    }

    public KeyValue(String key, String value, String writtenByLeader) {
        this.key = key;
        this.value = value;
        this.writtenByLeader = writtenByLeader;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getWrittenByLeader() {
        return writtenByLeader;
    }

    public void setWrittenByLeader(String writtenByLeader) {
        this.writtenByLeader = writtenByLeader;
    }
}