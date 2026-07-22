const baseLogs = [
  { command: "PUT", key: "feature_flags", value: "raft-v2", status: "Committed" },
  { command: "GET", key: "cluster_name", value: "production", status: "Replicated" },
  { command: "DELETE", key: "legacy_mode", value: "—", status: "Committed" },
  { command: "PUT", key: "cache_ttl", value: "300", status: "Replicated" },
  { command: "PUT", key: "maintenance", value: "false", status: "Pending" },
];

const createLogs = (commitIndex, term, statusOverrides = {}) =>
  baseLogs.map((log, offset) => ({
    ...log,
    index: commitIndex - offset,
    term: offset === 4 ? term - 1 : term,
    status: statusOverrides[offset] || log.status,
  }));

export const nodeDetails = [
  {
    id: "1",
    name: "Node 1",
    role: "Leader",
    status: "Running",
    term: 5,
    commitIndex: 121,
    lastAppliedIndex: 121,
    totalLogEntries: 145,
    lastHeartbeat: "2 sec ago",
    uptime: "12h 35m",
    address: "localhost:5001",
    logs: createLogs(121, 5),
    replicationStatus: [
      { name: "Node 2", status: "In Sync", logIndex: 120 },
      { name: "Node 3", status: "In Sync", logIndex: 121 },
    ],
    metrics: [
      { label: "CPU Usage", value: "28%", tone: "indigo" }, { label: "Memory Usage", value: "1.8 GB", tone: "purple" },
      { label: "Network Latency", value: "12 ms", tone: "emerald" }, { label: "Requests / Sec", value: "246", tone: "amber" },
      { label: "Election Timeout", value: "300 ms", tone: "indigo" }, { label: "Last Snapshot", value: "18 min ago", tone: "slate" },
    ],
  },
  {
    id: "2",
    name: "Node 2",
    role: "Follower",
    status: "Running",
    term: 5,
    commitIndex: 120,
    currentLeader: "Node 1",
    lastAppliedIndex: 120,
    totalLogEntries: 145,
    lastHeartbeat: "1 sec ago",
    uptime: "10h 12m",
    address: "localhost:5002",
    logs: createLogs(120, 5, { 0: "Replicated" }),
    replicationStatus: [
      { name: "Node 1", status: "In Sync", logIndex: 121 },
      { name: "Node 3", status: "Catching Up", logIndex: 119 },
    ],
    metrics: [
      { label: "CPU Usage", value: "19%", tone: "indigo" }, { label: "Memory Usage", value: "1.5 GB", tone: "purple" },
      { label: "Network Latency", value: "16 ms", tone: "emerald" }, { label: "Requests / Sec", value: "198", tone: "amber" },
      { label: "Election Timeout", value: "300 ms", tone: "indigo" }, { label: "Last Snapshot", value: "20 min ago", tone: "slate" },
    ],
  },
  {
    id: "3",
    name: "Node 3",
    role: "Follower",
    status: "Running",
    term: 5,
    commitIndex: 121,
    currentLeader: "Node 1",
    lastAppliedIndex: 121,
    totalLogEntries: 145,
    lastHeartbeat: "2 sec ago",
    uptime: "11h 47m",
    address: "localhost:5003",
    logs: createLogs(121, 5, { 0: "Replicated" }),
    replicationStatus: [
      { name: "Node 1", status: "In Sync", logIndex: 121 },
      { name: "Node 2", status: "In Sync", logIndex: 120 },
    ],
    metrics: [
      { label: "CPU Usage", value: "23%", tone: "indigo" }, { label: "Memory Usage", value: "1.6 GB", tone: "purple" },
      { label: "Network Latency", value: "14 ms", tone: "emerald" }, { label: "Requests / Sec", value: "217", tone: "amber" },
      { label: "Election Timeout", value: "300 ms", tone: "indigo" }, { label: "Last Snapshot", value: "16 min ago", tone: "slate" },
    ],
  },
];

export const getNodeDetails = (id) => nodeDetails.find((node) => node.id === String(id));
