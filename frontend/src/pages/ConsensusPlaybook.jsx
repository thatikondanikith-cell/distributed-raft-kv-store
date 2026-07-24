import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  BookOpen,
  Server,
  Database,
  HelpCircle,
  Maximize2,
  Minimize2,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";

// Coordinates mapping for SVG network visualizer
const COORDS = {
  1: { x: 200, y: 55 },      // Top node
  2: { x: 295, y: 170 },     // Bottom-right node
  3: { x: 105, y: 170 },     // Bottom-left node
  client: { x: 200, y: 265 } // Client writer at bottom
};

// Simulation speed map in milliseconds
const SPEED_MAP = {
  slow: 5000,
  normal: 3000,
  fast: 1500
};

// --- SIMULATION CASES DEFINITION ---
const SIMULATION_CASES = [
  {
    id: "normal",
    title: "1. Normal Write & Commit",
    shortName: "Normal Write",
    summary: "Demonstrates client writing to the Leader, log replication to followers, achieving majority quorum, committing the write, and persisting the state to the MySQL database.",
    steps: [
      {
        badge: "CLIENT REQUEST",
        badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        title: "Client Initiates Write",
        description: "The Client Writer console issues a write request `PUT('user', 'nikith')` to the active cluster Leader (Node 2). Under Raft, all modifications must go through the Leader.",
        nodes: [
          { id: 1, role: "Follower", status: "Online", term: 1, logIndex: 1, logs: [{ idx: 1, term: 1, cmd: "SET initial" }], dbPersisted: true },
          { id: 2, role: "Leader", status: "Online", term: 1, logIndex: 1, logs: [{ idx: 1, term: 1, cmd: "SET initial" }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Online", term: 1, logIndex: 1, logs: [{ idx: 1, term: 1, cmd: "SET initial" }], dbPersisted: true },
        ],
        packets: [
          { id: "p1", from: "client", to: 2, type: "write", color: "#a855f7" }
        ],
        partition: false,
        mysqlFlashingNodeId: null
      },
      {
        badge: "LOG REPLICATION",
        badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        title: "Leader Appends & Replicates",
        description: "Node 2 appends the entry to its own local log as 'Uncommitted'. It then constructs AppendEntries RPCs and broadcasts them to followers Node 1 and Node 3.",
        nodes: [
          { id: 1, role: "Follower", status: "Online", term: 1, logIndex: 1, logs: [{ idx: 1, term: 1, cmd: "SET initial" }], dbPersisted: true },
          { id: 2, role: "Leader", status: "Online", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')", uncommitted: true }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Online", term: 1, logIndex: 1, logs: [{ idx: 1, term: 1, cmd: "SET initial" }], dbPersisted: true },
        ],
        packets: [
          { id: "p2a", from: 2, to: 1, type: "replicate", color: "#6366f1" },
          { id: "p2b", from: 2, to: 3, type: "replicate", color: "#6366f1" }
        ],
        partition: false,
        mysqlFlashingNodeId: null
      },
      {
        badge: "FOLLOWER ACK",
        badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        title: "Followers Append & Acknowledge",
        description: "Followers Node 1 and Node 3 receive the log entry, append it to their local logs as 'Uncommitted', and respond back to the Leader (Node 2) with a success acknowledgment.",
        nodes: [
          { id: 1, role: "Follower", status: "Online", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')", uncommitted: true }], dbPersisted: true },
          { id: 2, role: "Leader", status: "Online", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')", uncommitted: true }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Online", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')", uncommitted: true }], dbPersisted: true },
        ],
        packets: [
          { id: "p3a", from: 1, to: 2, type: "ack", color: "#10b981" },
          { id: "p3b", from: 3, to: 2, type: "ack", color: "#10b981" }
        ],
        partition: false,
        mysqlFlashingNodeId: null
      },
      {
        badge: "COMMIT & PERSIST",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        title: "Leader Commits & Saves to MySQL",
        description: "Having received acknowledgments from a quorum majority of nodes (3 out of 3, where only 2 were needed), Node 2 marks the log entry as 'Committed' and persists the state change to its MySQL database.",
        nodes: [
          { id: 1, role: "Follower", status: "Online", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')", uncommitted: true }], dbPersisted: true },
          { id: 2, role: "Leader", status: "Online", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Online", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')", uncommitted: true }], dbPersisted: true },
        ],
        packets: [],
        partition: false,
        mysqlFlashingNodeId: 2
      },
      {
        badge: "CONVERGENCE",
        badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        title: "Client Answer & Cluster Convergence",
        description: "The Leader returns a success message to the Client. On its next heartbeat, Node 2 propagates the updated commit index to Node 1 and Node 3, prompting them to commit the log and write to their MySQL databases.",
        nodes: [
          { id: 1, role: "Follower", status: "Online", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
          { id: 2, role: "Leader", status: "Online", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Online", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
        ],
        packets: [
          { id: "p5a", from: 2, to: "client", type: "response", color: "#a855f7" },
          { id: "p5b", from: 2, to: 1, type: "heartbeat", color: "#fbbf24" },
          { id: "p5c", from: 2, to: 3, type: "heartbeat", color: "#fbbf24" }
        ],
        partition: false,
        mysqlFlashingNodeId: null
      }
    ]
  },
  {
    id: "election",
    title: "2. Leader Failure & Election",
    shortName: "Leader Election",
    summary: "Demonstrates what happens when the Leader crashes: heartbeats stop, followers timeout, one initiates an election as a Candidate, gathers votes, and becomes the new Leader.",
    steps: [
      {
        badge: "LEADER CRASH",
        badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        title: "Leader Node 2 Crashes",
        description: "The active Leader (Node 2) crashes suddenly (shown in red). All heartbeat messages flow stops immediately. Followers Node 1 and Node 3 wait in vain for heartbeats.",
        nodes: [
          { id: 1, role: "Follower", status: "Online", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
          { id: 2, role: "Leader", status: "Offline", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Online", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
        ],
        packets: [],
        partition: false,
        mysqlFlashingNodeId: null
      },
      {
        badge: "ELECTION TIMEOUT",
        badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        title: "Followers Timeout",
        description: "Node 1 and Node 3 wait. Because their election timers are randomized (150ms-300ms) to prevent split votes, Node 1's election timer expires first.",
        nodes: [
          { id: 1, role: "Follower", status: "Online", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true, isTimingOut: true },
          { id: 2, role: "Leader", status: "Offline", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Online", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
        ],
        packets: [],
        partition: false,
        mysqlFlashingNodeId: null
      },
      {
        badge: "ELECTION START",
        badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        title: "Node 1 Becomes Candidate",
        description: "Node 1 transitions to Candidate. It increments the Term to 2, votes for itself, and broadcasts RequestVote RPCs to Node 3 to ask for its vote.",
        nodes: [
          { id: 1, role: "Candidate", status: "Online", term: 2, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true, votes: 1 },
          { id: 2, role: "Leader", status: "Offline", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Online", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
        ],
        packets: [
          { id: "pe3", from: 1, to: 3, type: "reqvote", color: "#c084fc" }
        ],
        partition: false,
        mysqlFlashingNodeId: null
      },
      {
        badge: "VOTE CAST",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        title: "Node 3 Grants Vote",
        description: "Node 3 receives the vote request. Since Node 1 has a higher Term (2 vs 1) and its logs are up-to-date, Node 3 votes for Node 1 and updates its term to 2.",
        nodes: [
          { id: 1, role: "Candidate", status: "Online", term: 2, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true, votes: 1 },
          { id: 2, role: "Leader", status: "Offline", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Online", term: 2, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
        ],
        packets: [
          { id: "pe4", from: 3, to: 1, type: "grantvote", color: "#10b981" }
        ],
        partition: false,
        mysqlFlashingNodeId: null
      },
      {
        badge: "LEADER ELECTED",
        badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        title: "Node 1 Assumes Leadership",
        description: "Node 1 counts votes. With 2 out of 3 votes (Node 1 + Node 3), it attains majority quorum. It transitions to Leader for Term 2 and immediately broadcasts heartbeats to Node 3.",
        nodes: [
          { id: 1, role: "Leader", status: "Online", term: 2, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
          { id: 2, role: "Follower", status: "Offline", term: 1, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Online", term: 2, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
        ],
        packets: [
          { id: "pe5", from: 1, to: 3, type: "heartbeat", color: "#fbbf24" }
        ],
        partition: false,
        mysqlFlashingNodeId: null
      }
    ]
  },
  {
    id: "follower_fail",
    title: "3. Follower Failure & Recovery",
    shortName: "Follower Fail",
    summary: "Demonstrates resilience: when a follower crashes, the cluster still reaches quorum on writes. When the follower recovers, the Leader catches it up automatically.",
    steps: [
      {
        badge: "FOLLOWER CRASH",
        badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        title: "Node 3 Crashes",
        description: "Follower Node 3 crashes. The cluster still has a functional majority quorum (Leader Node 1 and Follower Node 2 are online: 2 out of 3 nodes).",
        nodes: [
          { id: 1, role: "Leader", status: "Online", term: 2, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
          { id: 2, role: "Follower", status: "Online", term: 2, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Offline", term: 2, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
        ],
        packets: [],
        partition: false,
        mysqlFlashingNodeId: null
      },
      {
        badge: "CLIENT REQUEST",
        badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        title: "Client Issues Write to Leader",
        description: "Client submits `PUT('key', 'val')` to Leader Node 1. Node 1 appends locally as 'Uncommitted' and attempts to replicate to Node 2 and Node 3.",
        nodes: [
          { id: 1, role: "Leader", status: "Online", term: 2, logIndex: 3, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')", uncommitted: true }], dbPersisted: true },
          { id: 2, role: "Follower", status: "Online", term: 2, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Offline", term: 2, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
        ],
        packets: [
          { id: "pf2a", from: "client", to: 1, type: "write", color: "#a855f7" },
          { id: "pf2b", from: 1, to: 2, type: "replicate", color: "#6366f1" },
          { id: "pf2c", from: 1, to: 3, type: "blocked-rep", color: "#f43f5e" }
        ],
        partition: false,
        mysqlFlashingNodeId: null
      },
      {
        badge: "QUORUM COMMIT",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        title: "Quorum Achieved & Persisted",
        description: "Follower Node 2 appends and responds with success. Leader Node 1 has a quorum (2/3 nodes: Node 1 + Node 2). It commits the entry, saves to MySQL, and answers the client.",
        nodes: [
          { id: 1, role: "Leader", status: "Online", term: 2, logIndex: 3, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }], dbPersisted: true },
          { id: 2, role: "Follower", status: "Online", term: 2, logIndex: 3, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')", uncommitted: true }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Offline", term: 2, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
        ],
        packets: [
          { id: "pf3a", from: 2, to: 1, type: "ack", color: "#10b981" },
          { id: "pf3b", from: 1, to: "client", type: "response", color: "#a855f7" }
        ],
        partition: false,
        mysqlFlashingNodeId: 1
      },
      {
        badge: "FOLLOWER RECOVERY",
        badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        title: "Node 3 Recovers Status",
        description: "Node 3 comes back online. However, its log is stale (missing index 3). The Leader detects the mismatch during normal heartbeat checks.",
        nodes: [
          { id: 1, role: "Leader", status: "Online", term: 2, logIndex: 3, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }], dbPersisted: true },
          { id: 2, role: "Follower", status: "Online", term: 2, logIndex: 3, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Online", term: 2, logIndex: 2, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
        ],
        packets: [
          { id: "pf4a", from: 1, to: 3, type: "heartbeat", color: "#fbbf24" }
        ],
        partition: false,
        mysqlFlashingNodeId: null
      },
      {
        badge: "LOG CATCHUP",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        title: "Log Catchup & Sync",
        description: "Leader Node 1 sends the missing log entry (index 3) to Node 3. Node 3 appends it, commits it, saves to MySQL, and is now fully synchronized with the cluster.",
        nodes: [
          { id: 1, role: "Leader", status: "Online", term: 2, logIndex: 3, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }], dbPersisted: true },
          { id: 2, role: "Follower", status: "Online", term: 2, logIndex: 3, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Online", term: 2, logIndex: 3, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }], dbPersisted: true },
        ],
        packets: [
          { id: "pf5a", from: 1, to: 3, type: "replicate", color: "#6366f1" }
        ],
        partition: false,
        mysqlFlashingNodeId: 3
      }
    ]
  },
  {
    id: "partition",
    title: "4. Network Partition & Recovery",
    shortName: "Network Partition",
    summary: "Demonstrates Raft's partition handling: the old leader is isolated in a minority, unable to commit writes. The majority elects a new leader and progresses. Healing restores consistency.",
    steps: [
      {
        badge: "PARTITION OCCURS",
        badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        title: "Network Partition Splits Cluster",
        description: "A network partition splits the cluster: Node 2 (Leader) is isolated in a minority partition. Node 1 and Node 3 remain connected in a majority partition.",
        nodes: [
          { id: 1, role: "Follower", status: "Online", term: 2, logIndex: 3, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }], dbPersisted: true },
          { id: 2, role: "Leader", status: "Online", term: 2, logIndex: 3, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Online", term: 2, logIndex: 3, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }], dbPersisted: true },
        ],
        packets: [],
        partition: true,
        mysqlFlashingNodeId: null
      },
      {
        badge: "BLOCKED WRITE",
        badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        title: "Write to Stale Leader Blocked",
        description: "Client writes `PUT('stale_key', 'xx')` to Node 2. Node 2 accepts but replication is blocked by the partition. Node 2 cannot commit the write as it lacks quorum.",
        nodes: [
          { id: 1, role: "Follower", status: "Online", term: 2, logIndex: 3, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }], dbPersisted: true },
          { id: 2, role: "Leader", status: "Online", term: 2, logIndex: 4, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }, { idx: 4, term: 2, cmd: "PUT('stale_key', 'xx')", uncommitted: true }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Online", term: 2, logIndex: 3, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }], dbPersisted: true },
        ],
        packets: [
          { id: "pp2a", from: "client", to: 2, type: "write", color: "#a855f7" },
          { id: "pp2b", from: 2, to: 1, type: "blocked-rep", color: "#f43f5e" },
          { id: "pp2c", from: 2, to: 3, type: "blocked-rep", color: "#f43f5e" }
        ],
        partition: true,
        mysqlFlashingNodeId: null
      },
      {
        badge: "NEW ELECTION",
        badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        title: "Majority Side Elects Node 1",
        description: "Node 1 and Node 3 notice missing heartbeats from Node 2. Node 1 times out first, triggers election, increments Term to 3, gets Node 3's vote, and becomes Leader of the majority.",
        nodes: [
          { id: 1, role: "Leader", status: "Online", term: 3, logIndex: 3, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }], dbPersisted: true },
          { id: 2, role: "Leader", status: "Online", term: 2, logIndex: 4, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }, { idx: 4, term: 2, cmd: "PUT('stale_key', 'xx')", uncommitted: true }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Online", term: 3, logIndex: 3, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }], dbPersisted: true },
        ],
        packets: [
          { id: "pp3a", from: 1, to: 3, type: "heartbeat", color: "#fbbf24" }
        ],
        partition: true,
        mysqlFlashingNodeId: null
      },
      {
        badge: "MAJORITY COMMIT",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        title: "Successful Write in Majority",
        description: "Client writes `PUT('user', 'nikith')` to new Leader Node 1. Node 1 replicates to Node 3. Since Node 1 and Node 3 represent a majority, the write commits and saves to MySQL in Term 3.",
        nodes: [
          { id: 1, role: "Leader", status: "Online", term: 3, logIndex: 4, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }, { idx: 4, term: 3, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
          { id: 2, role: "Leader", status: "Online", term: 2, logIndex: 4, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }, { idx: 4, term: 2, cmd: "PUT('stale_key', 'xx')", uncommitted: true }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Online", term: 3, logIndex: 4, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }, { idx: 4, term: 3, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
        ],
        packets: [
          { id: "pp4a", from: "client", to: 1, type: "write", color: "#a855f7" },
          { id: "pp4b", from: 1, to: 3, type: "replicate", color: "#6366f1" },
          { id: "pp4c", from: 3, to: 1, type: "ack", color: "#10b981" }
        ],
        partition: true,
        mysqlFlashingNodeId: 1
      },
      {
        badge: "PARTITION HEAL",
        badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        title: "Heal, Step Down & Catch Up",
        description: "The partition heals. Node 2 receives heartbeats from Node 1 with a higher Term (3). Node 2 steps down to Follower, discards its uncommitted stale log entry, and pulls the correct log (Term 3) from Node 1.",
        nodes: [
          { id: 1, role: "Leader", status: "Online", term: 3, logIndex: 4, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }, { idx: 4, term: 3, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
          { id: 2, role: "Follower", status: "Online", term: 3, logIndex: 4, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }, { idx: 4, term: 3, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
          { id: 3, role: "Follower", status: "Online", term: 3, logIndex: 4, logs: [{ idx: 1, term: 1, cmd: "SET initial" }, { idx: 2, term: 1, cmd: "PUT('user', 'nikith')" }, { idx: 3, term: 2, cmd: "PUT('key', 'val')" }, { idx: 4, term: 3, cmd: "PUT('user', 'nikith')" }], dbPersisted: true },
        ],
        packets: [
          { id: "pp5a", from: 1, to: 2, type: "heartbeat", color: "#fbbf24" },
          { id: "pp5b", from: 1, to: 2, type: "replicate", color: "#6366f1" }
        ],
        partition: false,
        mysqlFlashingNodeId: 2
      }
    ]
  }
];

function ConsensusPlaybook() {
  const [activeCaseId, setActiveCaseId] = useState("normal");
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState("normal"); // slow, normal, fast
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playTimer = useRef(null);

  const activeCase = SIMULATION_CASES.find((c) => c.id === activeCaseId) || SIMULATION_CASES[0];
  const step = activeCase.steps[currentStepIdx] || activeCase.steps[0];

  // Stop playback when case changes
  const handleCaseChange = (caseId) => {
    setIsPlaying(false);
    setActiveCaseId(caseId);
    setCurrentStepIdx(0);
  };

  const handleNextStep = () => {
    setCurrentStepIdx((prev) => (prev < activeCase.steps.length - 1 ? prev + 1 : 0));
  };

  const handlePrevStep = () => {
    setCurrentStepIdx((prev) => (prev > 0 ? prev - 1 : activeCase.steps.length - 1));
  };

  const handleReset = () => {
    setCurrentStepIdx(0);
    setIsPlaying(false);
  };

  // Playback timer effect
  useEffect(() => {
    if (isPlaying) {
      playTimer.current = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev < activeCase.steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false); // Stop at the end
            return prev;
          }
        });
      }, SPEED_MAP[playSpeed]);
    } else {
      if (playTimer.current) {
        clearInterval(playTimer.current);
      }
    }

    return () => {
      if (playTimer.current) clearInterval(playTimer.current);
    };
  }, [isPlaying, activeCase, playSpeed]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Helper to resolve packet links
  const getPacketPath = (packet) => {
    const fromCoord = COORDS[packet.from];
    const toCoord = COORDS[packet.to];

    if (!fromCoord || !toCoord) return "";

    if (packet.type === "blocked-rep") {
      // Return a path that goes only 45% of the way and terminates
      const stopX = fromCoord.x + (toCoord.x - fromCoord.x) * 0.45;
      const stopY = fromCoord.y + (toCoord.y - fromCoord.y) * 0.45;
      return `M ${fromCoord.x} ${fromCoord.y} L ${stopX} ${stopY}`;
    }

    return `M ${fromCoord.x} ${fromCoord.y} L ${toCoord.x} ${toCoord.y}`;
  };

  const getBlockedHalfwayCoords = (packet) => {
    const fromCoord = COORDS[packet.from];
    const toCoord = COORDS[packet.to];
    if (!fromCoord || !toCoord) return { x: 0, y: 0 };
    return {
      x: fromCoord.x + (toCoord.x - fromCoord.x) * 0.45,
      y: fromCoord.y + (toCoord.y - fromCoord.y) * 0.45
    };
  };

  // Render SVG links style helper
  const getSimLinkStyle = (nodeAId, nodeBId) => {
    const nodeAObj = step.nodes.find((n) => n.id === nodeAId);
    const nodeBObj = step.nodes.find((n) => n.id === nodeBId);
    const aOnline = nodeAObj?.status === "Online";
    const bOnline = nodeBObj?.status === "Online";

    // Blocked if partitioned and nodes are on different sides
    // Partition separates Node 2 from Nodes 1 & 3
    const isPartitioned = step.partition && ((nodeAId === 2 && (nodeBId === 1 || nodeBId === 3)) || (nodeBId === 2 && (nodeAId === 1 || nodeAId === 3)));

    if (aOnline && bOnline && !isPartitioned) {
      return { stroke: "rgba(99, 102, 241, 0.45)", strokeWidth: 1.5, className: "network-link-active" };
    }
    if (isPartitioned) {
      return { stroke: "rgba(244, 63, 94, 0.35)", strokeWidth: 1.5, strokeDasharray: "3 3" };
    }
    return { stroke: "rgba(75, 85, 99, 0.15)", strokeWidth: 1, strokeDasharray: "4 4" };
  };

  return (
    <div className={`w-full max-w-7xl mx-auto flex flex-col gap-6 ${isFullscreen ? "fixed inset-0 z-50 bg-[#030408] p-6 overflow-y-auto" : ""}`}>
      
      {/* Playbook Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.03]">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <BookOpen className="text-indigo-400" size={24} />
            Raft Consensus Playbook
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.05)] uppercase tracking-wider font-mono">
              Demo Simulation
            </span>
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Self-contained step-by-step interactive workflow simulations illustrating the core mechanics of the Raft replication protocol.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Speed Selector */}
          <div className="flex items-center bg-slate-950/60 border border-slate-900 rounded-xl p-1 text-[10px] font-bold font-mono">
            <button
              onClick={() => setPlaySpeed("slow")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${playSpeed === "slow" ? "bg-indigo-500/10 text-indigo-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              SLOW
            </button>
            <button
              onClick={() => setPlaySpeed("normal")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${playSpeed === "normal" ? "bg-indigo-500/10 text-indigo-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              NORMAL
            </button>
            <button
              onClick={() => setPlaySpeed("fast")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${playSpeed === "fast" ? "bg-indigo-500/10 text-indigo-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              FAST
            </button>
          </div>

          {/* Full Screen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl border border-slate-900 bg-slate-950/40 hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            title={isFullscreen ? "Exit Presentation Mode" : "Presentation Mode"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Main Simulation Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left column (col-span-4): Case Selection and Step walkthrough explanation */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Case Selection Cards */}
          <div className="glass-card rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
              <HelpCircle size={14} className="text-indigo-400" />
              Select Scenario
            </div>

            <div className="flex flex-col gap-2">
              {SIMULATION_CASES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCaseChange(c.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border font-sans transition-all duration-200 cursor-pointer ${
                    activeCaseId === c.id
                      ? "bg-indigo-500/10 border-indigo-500/35 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.08)] font-bold"
                      : "bg-slate-950/20 border-slate-900/40 hover:bg-white/[0.01] hover:border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="text-xs font-bold">{c.shortName}</div>
                  <div className="text-[10px] opacity-70 mt-1 font-medium line-clamp-2 leading-relaxed">
                    {c.summary}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Walkthrough Box */}
          <div className="glass-card rounded-2xl p-6 flex-1 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)] min-h-[320px]">
            <div>
              {/* Progress and Badge */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border tracking-wider font-mono ${step.badgeColor}`}>
                  {step.badge}
                </span>
                <span className="text-[10px] font-bold text-slate-500 font-mono">
                  STEP {currentStepIdx + 1} OF {activeCase.steps.length}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-base font-extrabold text-slate-100 tracking-tight mb-2">
                {step.title}
              </h2>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
                {step.description}
              </p>

              {/* Raft Rules Highlight Checklist */}
              <div className="mt-5 border-t border-slate-900/50 pt-4 flex flex-col gap-2.5">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Raft Mechanism Active
                </div>
                <div className="flex items-start gap-2 text-xs">
                  {step.partition ? (
                    <XCircle size={14} className="text-rose-400 mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                  )}
                  <span className="text-slate-400 font-medium font-sans">
                    {step.partition ? "Network Partition active: Split brain prevention" : "Quorum replication: Consensus available"}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  {activeCaseId === "election" ? (
                    <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                  )}
                  <span className="text-slate-400 font-medium font-sans">
                    Leader heartbeat timeout & terms enforcement
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  {step.mysqlFlashingNodeId ? (
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/10 text-emerald-400 grid place-items-center mt-0.5 shrink-0 animate-ping">
                      <Database size={9} />
                    </span>
                  ) : (
                    <Database size={14} className="text-slate-500 mt-0.5 shrink-0" />
                  )}
                  <span className="text-slate-400 font-medium font-sans">
                    MySQL state machine updates on commit indexes
                  </span>
                </div>
              </div>
            </div>

            {/* Step progress dots */}
            <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-900/40">
              {activeCase.steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStepIdx(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentStepIdx === idx
                      ? "w-8 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                      : "w-2 bg-slate-800 hover:bg-slate-700"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Center column (col-span-5): SVG Animation Canvas */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* SVG Visualizer Box */}
          <div className="glass-card rounded-2xl p-5 flex flex-col items-center justify-between min-h-[380px] relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            
            {/* Simulation Node Header */}
            <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono border-b border-slate-900 pb-2 mb-2">
              <span>Raft Cluster View</span>
              <span className={isPlaying ? "text-emerald-400 animate-pulse" : "text-amber-400"}>
                {isPlaying ? "PLAYING SIMULATION" : "PAUSED"}
              </span>
            </div>

            {/* SVG Elements */}
            <div className="w-full h-full flex items-center justify-center flex-1 py-4">
              <svg width="100%" height="100%" viewBox="0 0 400 320" className="overflow-visible select-none">
                {/* Radar Grid circles for technology look */}
                <circle cx="200" cy="140" r="50" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
                <circle cx="200" cy="140" r="95" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
                <circle cx="200" cy="140" r="140" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />

                {/* Network Links */}
                <line x1={COORDS[1].x} y1={COORDS[1].y} x2={COORDS[2].x} y2={COORDS[2].y} {...getSimLinkStyle(1, 2)} />
                <line x1={COORDS[1].x} y1={COORDS[1].y} x2={COORDS[3].x} y2={COORDS[3].y} {...getSimLinkStyle(1, 3)} />
                <line x1={COORDS[2].x} y1={COORDS[2].y} x2={COORDS[3].x} y2={COORDS[3].y} {...getSimLinkStyle(2, 3)} />

                {/* Client Link to Leader (when Leader is online) */}
                {(() => {
                  const currentLeader = step.nodes.find((n) => n.role === "Leader" && n.status === "Online");
                  if (currentLeader) {
                    return (
                      <line
                        x1={COORDS.client.x}
                        y1={COORDS.client.y}
                        x2={COORDS[currentLeader.id].x}
                        y2={COORDS[currentLeader.id].y}
                        stroke="rgba(168, 85, 247, 0.3)"
                        strokeWidth="1.2"
                        strokeDasharray="4 3"
                      />
                    );
                  }
                  return null;
                })()}

                {/* Partition Boundary Wall */}
                {step.partition && (
                  <g>
                    {/* Vertical-ish red partition wall separating Node 2 from 1 & 3 */}
                    <line
                      x1="225"
                      y1="0"
                      x2="225"
                      y2="230"
                      stroke="#f43f5e"
                      strokeWidth="2"
                      strokeDasharray="5 5"
                      style={{ filter: "drop-shadow(0 0 5px rgba(244, 63, 94, 0.5))" }}
                    />
                    <rect x="200" y="90" width="50" height="20" rx="4" fill="#14070c" stroke="#f43f5e" strokeWidth="1" />
                    <text x="225" y="102" textAnchor="middle" fill="#f43f5e" fontSize="7" fontWeight="bold" fontFamily="monospace">
                      PARTITION
                    </text>
                  </g>
                )}

                {/* Animated Packets */}
                {step.packets.map((packet) => {
                  const pathString = getPacketPath(packet);
                  if (!pathString) return null;

                  return (
                    <g key={`${activeCaseId}-${currentStepIdx}-${packet.id}`}>
                      {/* Flying Packet Glow Circle */}
                      <circle r="4.5" fill={packet.color} style={{ filter: `drop-shadow(0 0 6px ${packet.color})` }}>
                        <animateMotion dur="0.9s" repeatCount="1" fill="freeze" path={pathString} />
                      </circle>
                      
                      {/* Red cross for blocked packets */}
                      {packet.type === "blocked-rep" && (
                        <g>
                          <circle
                            cx={getBlockedHalfwayCoords(packet).x}
                            cy={getBlockedHalfwayCoords(packet).y}
                            r="6"
                            fill="#14070c"
                            stroke="#f43f5e"
                            strokeWidth="1"
                            opacity="0"
                          >
                            <animate attributeName="opacity" values="0;1" dur="0.3s" begin="0.5s" fill="freeze" />
                          </circle>
                          <text
                            x={getBlockedHalfwayCoords(packet).x}
                            y={getBlockedHalfwayCoords(packet).y + 2.5}
                            textAnchor="middle"
                            fill="#f43f5e"
                            fontSize="8"
                            fontWeight="bold"
                            opacity="0"
                          >
                            <animate attributeName="opacity" values="0;1" dur="0.3s" begin="0.5s" fill="freeze" />
                            ×
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Client UI element inside SVG */}
                <g transform={`translate(${COORDS.client.x}, ${COORDS.client.y})`}>
                  <circle
                    cx="0"
                    cy="0"
                    r="13"
                    fill="#0a0c16"
                    stroke="#a855f7"
                    strokeWidth="1.5"
                    className={step.packets.some((p) => p.from === "client") ? "animate-pulse" : ""}
                  />
                  <text x="0" y="3" textAnchor="middle" fill="#c084fc" fontSize="8" fontWeight="extrabold" fontFamily="sans-serif">
                    CLI
                  </text>
                  <text x="0" y="24" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.05em">
                    CLIENT WRITER
                  </text>
                </g>

                {/* Nodes UI mapping */}
                {step.nodes.map((node) => {
                  const coord = COORDS[node.id];
                  const isLeader = node.role === "Leader";
                  const isOffline = node.status === "Offline";
                  const isCandidate = node.role === "Candidate";

                  let strokeColor = "#6366f1";
                  let fillColor = "#0a0c16";
                  let glowColor = "rgba(99, 102, 241, 0.1)";

                  if (isOffline) {
                    strokeColor = "#f43f5e";
                    fillColor = "#14070c";
                    glowColor = "rgba(244, 63, 94, 0.05)";
                  } else if (isLeader) {
                    strokeColor = "#fbbf24";
                    fillColor = "#1a0f07";
                    glowColor = "rgba(251, 191, 36, 0.15)";
                  } else if (isCandidate) {
                    strokeColor = "#c084fc";
                    fillColor = "#140a1d";
                    glowColor = "rgba(192, 132, 252, 0.15)";
                  }

                  const isDbFlashing = step.mysqlFlashingNodeId === node.id;

                  return (
                    <g key={node.id}>
                      {/* Ambient Pulse rings */}
                      {!isOffline && (
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r={node.isTimingOut ? "25" : "22"}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={node.isTimingOut ? "2" : "1.5"}
                          opacity="0.3"
                          className={node.isTimingOut ? "animate-pulse" : "animate-pulse"}
                          strokeDasharray={node.isTimingOut ? "4 2" : "none"}
                        />
                      )}

                      {/* Core Server Node Circle */}
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r="17"
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth="2"
                        style={{ filter: `drop-shadow(0 0 5px ${glowColor})` }}
                      />

                      {/* Node text */}
                      <text
                        cx={coord.x}
                        cy={coord.y}
                        x={coord.x}
                        y={coord.y + 3.5}
                        textAnchor="middle"
                        fill="#f1f5f9"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        N{node.id}
                      </text>

                      {/* Role text above */}
                      <text
                        x={coord.x}
                        y={coord.y - 23}
                        textAnchor="middle"
                        fill={isOffline ? "#f43f5e" : isLeader ? "#fbbf24" : isCandidate ? "#c084fc" : "#94a3b8"}
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                        letterSpacing="0.05em"
                      >
                        {isOffline ? "CRASHED" : node.role.toUpperCase()}
                      </text>

                      {/* Vote Count indicator for Candidate */}
                      {isCandidate && node.votes !== undefined && (
                        <g>
                          <rect x={coord.x - 18} y={coord.y + 20} width="36" height="10" rx="3" fill="#140a1d" stroke="#c084fc" strokeWidth="0.8" />
                          <text x={coord.x} y={coord.y + 28} textAnchor="middle" fill="#c084fc" fontSize="6.5" fontWeight="bold" fontFamily="monospace">
                            VOTES: {node.votes}/3
                          </text>
                        </g>
                      )}

                      {/* MySQL Database Cylinder Icon below node */}
                      {!isOffline && (
                        <g transform={`translate(${coord.x - 15}, ${coord.y + 20})`}>
                          {/* Cylinder base */}
                          <path
                            d="M 0 5 C 0 2, 30 2, 30 5 L 30 14 C 30 17, 0 17, 0 14 Z"
                            fill={isDbFlashing ? "rgba(16, 185, 129, 0.25)" : "rgba(255,255,255,0.02)"}
                            stroke={isDbFlashing ? "#10b981" : "rgba(148, 163, 184, 0.35)"}
                            strokeWidth="1.2"
                            className={isDbFlashing ? "animate-pulse" : ""}
                          />
                          {/* Cylinder top ellipse */}
                          <ellipse
                            cx="15"
                            cy="5"
                            rx="15"
                            ry="3"
                            fill={isDbFlashing ? "rgba(16, 185, 129, 0.45)" : "rgba(255,255,255,0.05)"}
                            stroke={isDbFlashing ? "#10b981" : "rgba(148, 163, 184, 0.35)"}
                            strokeWidth="1.2"
                          />
                          <text
                            x="15"
                            y="12.5"
                            textAnchor="middle"
                            fontSize="6"
                            fill={isDbFlashing ? "#34d399" : "#475569"}
                            fontWeight="extrabold"
                            fontFamily="monospace"
                          >
                            MySQL
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* SVG Legend */}
            <div className="w-full flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-900 pt-3 bg-slate-950/20 px-3 py-1.5 rounded-xl font-sans mt-2">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Leader
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Follower
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Crash
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Candidate
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-2 rounded border border-[#10b981] bg-emerald-500/10" /> MySQL
              </div>
            </div>
          </div>

          {/* Stepper Player Controls */}
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-1.5">
              {/* Prev */}
              <button
                onClick={handlePrevStep}
                className="p-2 rounded-lg border border-slate-900 bg-slate-950/50 hover:bg-slate-900/50 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                title="Previous Step"
              >
                <SkipBack size={14} />
              </button>

              {/* Play / Pause */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  isPlaying
                    ? "bg-amber-500/10 border border-amber-500/35 text-amber-400 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.08)]"
                    : "bg-indigo-600 border border-indigo-500 text-white hover:bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                }`}
                title={isPlaying ? "Pause Autoplay" : "Play Autoplay"}
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              </button>

              {/* Next */}
              <button
                onClick={handleNextStep}
                className="p-2 rounded-lg border border-slate-900 bg-slate-950/50 hover:bg-slate-900/50 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                title="Next Step"
              >
                <SkipForward size={14} />
              </button>

              {/* Reset */}
              <button
                onClick={handleReset}
                className="p-2 rounded-lg border border-slate-900 bg-slate-950/50 hover:bg-slate-900/50 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                title="Restart Case"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            <div className="text-[10px] font-bold text-slate-500 font-mono">
              STATUS: STEP {currentStepIdx + 1} / {activeCase.steps.length}
            </div>
          </div>
        </div>

        {/* Right column (col-span-3): In-depth Local State Inspector of replica logs */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Log replica viewer card */}
          <div className="glass-card rounded-2xl p-5 flex flex-col h-full shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Server size={14} className="text-indigo-400" />
                Local State Inspector
              </h3>
              <span className="text-[9px] text-slate-600 font-bold font-mono">
                TERM & INDEX
              </span>
            </div>

            {/* List representing the nodes current local states */}
            <div className="flex flex-col gap-4 flex-1">
              {step.nodes.map((node) => {
                const isLeader = node.role === "Leader";
                const isOffline = node.status === "Offline";
                const isCandidate = node.role === "Candidate";

                let roleColor = "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
                if (isOffline) roleColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                else if (isLeader) roleColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                else if (isCandidate) roleColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";

                return (
                  <div key={node.id} className={`bg-slate-950/40 border border-slate-900/60 rounded-xl p-3.5 flex flex-col gap-2.5 transition-all ${isOffline ? "opacity-45" : ""}`}>
                    {/* Node Metadata header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? "bg-rose-500" : isLeader ? "bg-amber-400 animate-pulse" : "bg-indigo-400"}`} />
                        <span className="text-xs font-bold text-slate-200 font-mono">Node {node.id}</span>
                      </div>
                      <span className={`text-[8px] font-extrabold uppercase px-2 py-0.2 rounded-full border tracking-wide font-mono ${roleColor}`}>
                        {node.role}
                      </span>
                    </div>

                    {/* Term and index stats */}
                    <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-500 font-mono uppercase bg-slate-950/20 px-2 py-1.5 rounded-lg border border-slate-900/40">
                      <div>Term: <span className="text-slate-300">{node.term}</span></div>
                      <div>Log Idx: <span className="text-slate-300">{node.logIndex}</span></div>
                    </div>

                    {/* Node logs list */}
                    <div className="flex flex-col gap-1">
                      <div className="text-[8px] font-extrabold text-slate-600 uppercase tracking-wider font-mono mb-1">
                        Append-Only Log Entries
                      </div>
                      {node.logs.length === 0 ? (
                        <div className="text-[9px] text-slate-700 italic font-mono px-2 py-1 bg-slate-950/20 rounded border border-slate-950">
                          Empty
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 max-h-[85px] overflow-y-auto pr-1">
                          {node.logs.map((log) => (
                            <div
                              key={log.idx}
                              className={`flex items-center justify-between gap-1 text-[8.5px] font-mono px-2 py-1 rounded border leading-none transition-all ${
                                log.uncommitted
                                  ? "bg-slate-950 border-amber-500/20 text-amber-500/70"
                                  : "bg-emerald-500/5 border-emerald-500/15 text-emerald-400"
                              }`}
                            >
                              <span className="font-bold opacity-75">#{log.idx} (T{log.term})</span>
                              <span className="truncate text-slate-300 font-medium">{log.cmd}</span>
                              <span className="text-[7.5px] font-extrabold uppercase tracking-wide opacity-80 shrink-0">
                                {log.uncommitted ? "UNCOMMITTED" : "COMMIT"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default ConsensusPlaybook;
