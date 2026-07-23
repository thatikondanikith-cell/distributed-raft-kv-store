package com.raft.backend.raft.model;

public class LogEntry {

    private int term;

    private String key;

    private String value;

    private String leaderName;

    public LogEntry() {
    }

    public LogEntry(int term, String key, String value) {
        this.term = term;
        this.key = key;
        this.value = value;
    }

    public LogEntry(int term, String key, String value, String leaderName) {
        this.term = term;
        this.key = key;
        this.value = value;
        this.leaderName = leaderName;
    }

    public int getTerm() {
        return term;
    }

    public void setTerm(int term) {
        this.term = term;
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

    public String getLeaderName() {
        return leaderName;
    }

    public void setLeaderName(String leaderName) {
        this.leaderName = leaderName;
    }
}