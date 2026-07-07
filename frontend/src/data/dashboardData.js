export const nodes = [
  {
    id: 1,
    nodeName: "Node 1",
    role: "Leader",
    status: "Online",
    term: 18,
    logIndex: 584,
  },
  {
    id: 2,
    nodeName: "Node 2",
    role: "Follower",
    status: "Online",
    term: 18,
    logIndex: 584,
  },
  {
    id: 3,
    nodeName: "Node 3",
    role: "Follower",
    status: "Online",
    term: 18,
    logIndex: 584,
  },
];

export const overview = [
  {
    id: 1,
    title: "Status",
    value: "Healthy",
    icon: "status",
  },
  {
    id: 2,
    title: "Leader",
    value: "Node 1",
    icon: "leader",
  },
  {
    id: 3,
    title: "Nodes",
    value: "3 / 3",
    icon: "nodes",
  },
  {
    id: 4,
    title: "Commit Index",
    value: "584",
    icon: "commit",
  },
  {
    id: 5,
    title: "Current Term",
    value: "18",
    icon: "term",
  },
];
export const recentActivity = [
  {
    id: 1,
    type: "election",
    message: "Node 1 elected as Leader for term 18",
    time: "2 mins ago",
  },
  {
    id: 2,
    type: "commit",
    message: "Log entry committed at index 584",
    time: "5 mins ago",
  },
  {
    id: 3,
    type: "heartbeat",
    message: "Leader heartbeat sent to all followers",
    time: "8 mins ago",
  },
  {
    id: 4,
    type: "sync",
    message: "Node 3 synced log entries up to index 584",
    time: "12 mins ago",
  },
  {
    id: 5,
    type: "sync",
    message: "Node 2 synced log entries up to index 584",
    time: "14 mins ago",
  },
  {
    id: 6,
    type: "commit",
    message: "Log entry committed at index 583",
    time: "18 mins ago",
  },
];
export const logIndexHistory = [578, 579, 580, 581, 583, 584];