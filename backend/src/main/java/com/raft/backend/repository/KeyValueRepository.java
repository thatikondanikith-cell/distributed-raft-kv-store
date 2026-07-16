package com.raft.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.raft.backend.entity.KeyValue;

@Repository
public interface KeyValueRepository extends JpaRepository<KeyValue, String> {

}
