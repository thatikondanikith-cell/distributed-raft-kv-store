package com.raft.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.raft.backend.raft.model.LogEntry;
import com.raft.backend.raft.service.RaftNode;
import com.raft.backend.raft.service.RaftService;

@SpringBootTest
class BackendApplicationTests {

    @Autowired
    private RaftService raftService;

    @Test
    void testLogCompactionAndCatchUp() {
        // Get the leader node
        RaftNode leader = raftService.getRaftNode();
        assertEquals("Node-1", leader.getNodeId());

        // Make sure all nodes are online
        for (RaftNode node : raftService.getCluster().getNodes()) {
            node.setOnline(true);
        }

        // Initially commitIndex should be -1
        assertEquals(-1, leader.getCommitIndex());

        int term = leader.getCurrentTerm();

        // Append 6 entries (index 0 to 5) to trigger snapshot (threshold is 5)
        for (int i = 0; i < 6; i++) {
            raftService.appendLogEntry(new LogEntry(term, "key" + i, "val" + i));
        }

        // Leader commit index should be 5 (index 0 to 5)
        assertEquals(5, leader.getCommitIndex());

        // Snapshot should have triggered!
        // So lastIncludedIndex should be 5
        assertEquals(5, leader.getLastIncludedIndex());
        assertEquals(term, leader.getLastIncludedTerm());

        // The leader's log list size should now be 0 (all 6 entries cleared)
        assertEquals(0, leader.getLogEntries().size());
        assertEquals(6, leader.getLogEntriesSize());

        // Test appending another log entry after snapshot
        raftService.appendLogEntry(new LogEntry(term, "keyNew", "valNew"));

        // Commit index should have updated to 6!
        assertEquals(6, leader.getCommitIndex());
        // It immediately gets snapshotted up to 6, so size is 0
        assertEquals(0, leader.getLogEntries().size());
        assertEquals(7, leader.getLogEntriesSize());

        // Test lagging follower catch-up:
        // 1. Mark Node-3 offline
        RaftNode follower = raftService.getCluster().getNodes().stream()
                .filter(n -> n.getNodeId().equals("Node-3"))
                .findFirst().get();
        follower.setOnline(false);

        // 2. Append another 5 entries to leader (triggering another snapshot)
        for (int i = 7; i < 12; i++) {
            raftService.appendLogEntry(new LogEntry(term, "key" + i, "val" + i));
        }

        // Leader last included index should now be 11 (index 0 to 11, total 12 entries)
        assertEquals(11, leader.getCommitIndex());
        assertEquals(11, leader.getLastIncludedIndex());

        // 3. Mark Node-3 online
        follower.setOnline(true);

        // 4. Force replication / heartbeat catch-up
        raftService.sendHeartbeat();

        // Node-3 should have been synchronized to the leader's snapshot
        assertEquals(leader.getLastIncludedIndex(), follower.getLastIncludedIndex());
        assertEquals(leader.getCommitIndex(), follower.getCommitIndex());
        assertEquals(leader.getLogEntries().size(), follower.getLogEntries().size());
    }
}
