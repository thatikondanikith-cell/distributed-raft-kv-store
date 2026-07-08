import React, { useState } from "react";
import NodeCard from "../components/NodeCard";
import OverviewCard from "../components/OverviewCard";
import ActivityItem from "../components/ActivityItem";
import TrendCard from "../components/TrendCard";

import {
  CircleCheckBig,
  Crown,
  Server,
  Database,
  Hash,
  Terminal,
  Activity,
} from "lucide-react";

// Coordinates mapping for SVG network visualizer
const COORDS = {
  1: { x: 200, y: 55 },
  2: { x: 295, y: 170 },
  3: { x: 105, y: 170 },
  client: { x: 200, y: 255 }
};

function NetworkTopologySVG({ nodes, writingState }) {
  const leaderNode = nodes.find(n => n.role === "Leader" && n.status === "Online");
  const activeFollowers = nodes.filter(n => n.role === "Follower" && n.status === "Online");

  // Determine path link styles based on status
  const getLinkStyle = (nodeAId, nodeBId) => {
    const aOnline = nodes.find(n => n.id === nodeAId)?.status === "Online";
    const bOnline = nodes.find(n => n.id === nodeBId)?.status === "Online";
    return aOnline && bOnline
      ? { stroke: "rgba(99, 102, 241, 0.35)", strokeWidth: 1.5, className: "network-link-active" }
      : { stroke: "rgba(75, 85, 99, 0.15)", strokeWidth: 1, strokeDasharray: "4 4" };
  };

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 300" className="overflow-visible select-none">
      
      {/* Dynamic Background radar grid */}
      <circle cx="200" cy="140" r="50" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
      <circle cx="200" cy="140" r="95" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
      <circle cx="200" cy="140" r="140" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
      
      {/* Radar sweeping lines */}
      <line x1="200" y1="0" x2="200" y2="280" stroke="rgba(255, 255, 255, 0.01)" strokeWidth="1" />
      <line x1="0" y1="140" x2="400" y2="140" stroke="rgba(255, 255, 255, 0.01)" strokeWidth="1" />

      {/* Network Replication Links */}
      <line x1={COORDS[1].x} y1={COORDS[1].y} x2={COORDS[2].x} y2={COORDS[2].y} {...getLinkStyle(1, 2)} />
      <line x1={COORDS[1].x} y1={COORDS[1].y} x2={COORDS[3].x} y2={COORDS[3].y} {...getLinkStyle(1, 3)} />
      <line x1={COORDS[2].x} y1={COORDS[2].y} x2={COORDS[3].x} y2={COORDS[3].y} {...getLinkStyle(2, 3)} />

      {/* Client write link */}
      {leaderNode && (
        <line
          x1={COORDS.client.x}
          y1={COORDS.client.y}
          x2={COORDS[leaderNode.id].x}
          y2={COORDS[leaderNode.id].y}
          stroke="rgba(168, 85, 247, 0.3)"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
      )}

      {/* Continuous Heartbeat dots flowing from Leader to online Followers */}
      {leaderNode && activeFollowers.map(f => {
        const pathD = `M ${COORDS[leaderNode.id].x} ${COORDS[leaderNode.id].y} L ${COORDS[f.id].x} ${COORDS[f.id].y}`;
        return (
          <circle key={`hb-${f.id}`} r="2" fill="#fbbf24" style={{ filter: "drop-shadow(0 0 3px #fbbf24)" }}>
            <animateMotion dur="2.8s" repeatCount="indefinite" path={pathD} />
          </circle>
        );
      })}

      {/* Stage 1 write animation packet (client -> leader) */}
      {writingState.active && writingState.stage === 1 && leaderNode && (
        <circle r="4.5" fill="#a855f7" style={{ filter: "drop-shadow(0 0 6px #a855f7)" }}>
          <animateMotion 
            dur="0.8s" 
            repeatCount="1" 
            fill="freeze" 
            path={`M ${COORDS.client.x} ${COORDS.client.y} L ${COORDS[leaderNode.id].x} ${COORDS[leaderNode.id].y}`} 
          />
        </circle>
      )}

      {/* Stage 2 write replication packet (leader -> followers) */}
      {writingState.active && writingState.stage === 2 && leaderNode && activeFollowers.map(f => {
        const pathD = `M ${COORDS[leaderNode.id].x} ${COORDS[leaderNode.id].y} L ${COORDS[f.id].x} ${COORDS[f.id].y}`;
        return (
          <circle key={`write-rep-${f.id}`} r="3" fill="#a855f7" style={{ filter: "drop-shadow(0 0 5px #a855f7)" }}>
            <animateMotion dur="1s" repeatCount="1" fill="freeze" path={pathD} />
          </circle>
        );
      })}

      {/* Client node */}
      <g>
        <circle
          cx={COORDS.client.x}
          cy={COORDS.client.y}
          r="13"
          fill="#0a0c16"
          stroke={writingState.active ? "#a855f7" : "#475569"}
          strokeWidth="1.5"
          className={writingState.active ? "animate-pulse" : ""}
        />
        <text x={COORDS.client.x} y={COORDS.client.y + 3} textAnchor="middle" fill={writingState.active ? "#c084fc" : "#64748b"} fontSize="8" fontWeight="extrabold" fontFamily="sans-serif">
          CLI
        </text>
        <text x={COORDS.client.x} y={COORDS.client.y + 24} textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.05em">
          CLIENT WRITER
        </text>
      </g>

      {/* Cluster Nodes */}
      {nodes.map(node => {
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

        return (
          <g key={node.id}>
            {/* Ambient Pulse Ring */}
            {!isOffline && (
              <circle
                cx={coord.x}
                cy={coord.y}
                r="22"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.5"
                opacity="0.3"
                className="animate-pulse"
              />
            )}
            
            {/* Core server dot */}
            <circle
              cx={coord.x}
              cy={coord.y}
              r="17"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2"
              style={{ filter: `drop-shadow(0 0 5px ${glowColor})` }}
            />

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

            <text
              x={coord.x}
              y={coord.y - 24}
              textAnchor="middle"
              fill={isOffline ? "#f43f5e" : isLeader ? "#fbbf24" : isCandidate ? "#c084fc" : "#94a3b8"}
              fontSize="8"
              fontWeight="bold"
              fontFamily="sans-serif"
              letterSpacing="0.05em"
            >
              {isOffline ? "CRASHED" : node.role.toUpperCase()}
            </text>
          </g>
        );
      })}

    </svg>
  );
}

function Dashboard({
  nodes,
  activities,
  logHistory,
  writingState,
  onToggleNode,
  onTriggerWrite,
  onForceElection,
}) {
  const [writeKey, setWriteKey] = useState("");
  const [writeValue, setWriteValue] = useState("");

  const activeNodesCount = nodes.filter((n) => n.status === "Online").length;
  const leaderNode = nodes.find((n) => n.role === "Leader" && n.status === "Online");
  const maxIndex = Math.max(...nodes.map((n) => n.logIndex));
  const maxTerm = Math.max(...nodes.map((n) => n.term));

  let clusterHealth = "Healthy";
  if (activeNodesCount === 2) {
    clusterHealth = "Degraded";
  } else if (activeNodesCount < 2) {
    clusterHealth = "Unhealthy";
  }

  const overviewData = [
    {
      id: 1,
      title: "Cluster Health Status",
      value: clusterHealth === "Healthy" ? "HEALTHY" : clusterHealth === "Degraded" ? "DEGRADED" : "QUORUM LOST",
      icon: "status",
    },
    {
      id: 2,
      title: "Active Leader",
      value: leaderNode ? leaderNode.nodeName : "None",
      icon: "leader",
    },
    {
      id: 3,
      title: "Cluster Active Nodes",
      value: `${activeNodesCount} / 3`,
      icon: "nodes",
    },
    {
      id: 4,
      title: "Consensus Commit Index",
      value: maxIndex.toString(),
      icon: "commit",
    },
    {
      id: 5,
      title: "Consensus Term",
      value: maxTerm.toString(),
      icon: "term",
    },
  ];

  const getIcon = (icon) => {
    switch (icon) {
      case "status":   return <CircleCheckBig size={15} />;
      case "leader":   return <Crown size={15} />;
      case "nodes":    return <Server size={15} />;
      case "commit":   return <Database size={15} />;
      case "term":     return <Hash size={15} />;
      default:         return null;
    }
  };

  const themeMap = {
    status: {
      borderColor: clusterHealth === "Healthy" ? "border-t-emerald-500/80" : clusterHealth === "Degraded" ? "border-t-amber-500/80" : "border-t-rose-500/80",
      iconBg: clusterHealth === "Healthy" ? "bg-emerald-500/10" : clusterHealth === "Degraded" ? "bg-amber-500/10" : "bg-rose-500/10",
      iconText: clusterHealth === "Healthy" ? "text-emerald-400" : clusterHealth === "Degraded" ? "text-amber-400" : "text-rose-400",
      valueColor: clusterHealth === "Healthy" ? "text-emerald-400 glow-text-emerald" : clusterHealth === "Degraded" ? "text-amber-400 glow-text-amber" : "text-rose-400",
    },
    leader: {
      borderColor: leaderNode ? "border-t-amber-500/80" : "border-t-slate-800",
      iconBg: leaderNode ? "bg-amber-500/10" : "bg-slate-800/40",
      iconText: leaderNode ? "text-amber-400" : "text-slate-500",
      valueColor: leaderNode ? "text-amber-400 glow-text-amber" : "text-slate-500",
    },
    nodes: {
      borderColor: "border-t-indigo-500/80",
      iconBg: "bg-indigo-500/10",
      iconText: "text-indigo-400",
      valueColor: "text-indigo-400 glow-text-indigo",
    },
    commit: {
      borderColor: "border-t-violet-500/80",
      iconBg: "bg-violet-500/10",
      iconText: "text-violet-400",
      valueColor: "text-violet-450",
    },
    term: {
      borderColor: "border-t-rose-500/80",
      iconBg: "bg-rose-500/10",
      iconText: "text-rose-400",
      valueColor: "text-rose-450",
    },
  };

  const SectionLabel = ({ children }) => (
    <div className="flex items-center gap-3 mb-5">
      <span className="w-1 h-5 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
      <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider font-sans">
        {children}
      </h2>
    </div>
  );

  const onSubmitWrite = (e) => {
    e.preventDefault();
    if (!writeKey || !writeValue) return;
    const success = onTriggerWrite(writeKey, writeValue);
    if (success) {
      setWriteKey("");
      setWriteValue("");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-white/[0.03]">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Cluster Console
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Real-time telemetry and consensus simulation for the distributed Raft key-value store.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/15 text-[10px] text-emerald-400 font-extrabold font-mono tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.05)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          LIVE TELEMETRY
        </div>
      </div>

      {/* Cluster Health Metrics */}
      <section>
        <SectionLabel>Cluster Telemetry Overview</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {overviewData.map((item) => (
            <OverviewCard
              key={item.id}
              title={item.title}
              value={item.value}
              icon={getIcon(item.icon)}
              theme={themeMap[item.icon]}
            />
          ))}
        </div>
      </section>

      {/* Main Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Node Grid & Simulation CLI Console */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Node Grid */}
          <div>
            <SectionLabel>Cluster Node Replicas</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {nodes.map((node) => (
                <NodeCard
                  key={node.id}
                  id={node.id}
                  nodeName={node.nodeName}
                  role={node.role}
                  status={node.status}
                  term={node.term}
                  logIndex={node.logIndex}
                  onToggle={onToggleNode}
                />
              ))}
            </div>
          </div>

          {/* Client Write CLI Form */}
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 font-mono">
                <Terminal size={16} className="text-indigo-400" />
                State Replication Command Console
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium font-sans">
                Interact with the active Leader replica to write key-value pairs. Quorum consensus is verified in real-time.
              </p>
            </div>

            <form onSubmit={onSubmitWrite} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 flex flex-col gap-1.5 w-full">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide font-sans">Key</label>
                <input
                  type="text"
                  value={writeKey}
                  onChange={(e) => setWriteKey(e.target.value)}
                  placeholder="e.g. session_id"
                  className="bg-slate-950/60 border border-slate-900 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 font-sans transition-all"
                  required
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5 w-full">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide font-sans">Value</label>
                <input
                  type="text"
                  value={writeValue}
                  onChange={(e) => setWriteValue(e.target.value)}
                  placeholder="e.g. auth_user_99"
                  className="bg-slate-950/60 border border-slate-900 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 font-sans transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={writingState.active || !leaderNode || activeNodesCount < 2}
                className={`px-5 py-2.5 rounded-xl border font-bold text-xs font-mono tracking-wider transition-all duration-300 w-full sm:w-auto cursor-pointer ${
                  writingState.active
                    ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400 opacity-60 cursor-not-allowed animate-pulse"
                    : !leaderNode || activeNodesCount < 2
                    ? "bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed opacity-50"
                    : "bg-indigo-600 border-indigo-500 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                }`}
              >
                {writingState.active ? "REPLICATING..." : "EXECUTE PUT"}
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-900/60">
              <button
                onClick={onForceElection}
                disabled={activeNodesCount < 2}
                className={`px-4 py-2 rounded-xl border font-semibold text-[10px] font-mono tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                  activeNodesCount < 2
                    ? "bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed"
                    : "border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                }`}
              >
                Force Re-election
              </button>
              <div className="text-[10px] text-slate-500 font-sans">
                {!leaderNode && activeNodesCount >= 2 
                  ? "* Cluster leaderless. Automatic election timeout in progress..." 
                  : activeNodesCount < 2 
                  ? "* Quorum Lost. Consensual writes and elections disabled." 
                  : "* Cluster healthy. Leaders heartbeat continuously."}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Network Topology Visualizer */}
        <div className="lg:col-span-1">
          <SectionLabel>Network Link Status</SectionLabel>
          <div className="glass-card rounded-2xl p-5 flex flex-col items-center justify-between h-full min-h-[350px] relative overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <NetworkTopologySVG nodes={nodes} writingState={writingState} />
            </div>

            {/* Topology Legend */}
            <div className="w-full flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-900 pt-3 bg-slate-950/20 px-3 py-1.5 rounded-xl font-sans">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Leader
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> Follower
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Crash
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" /> Packet
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Section: Recent Activity & Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Activity Stream (2 cols) */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <SectionLabel>Raft Live Activity Console</SectionLabel>
          <div className="glass-card rounded-2xl overflow-hidden flex-1 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div className="bg-slate-950/40 px-6 py-3.5 border-b border-slate-900 flex items-center gap-2 text-slate-400 font-sans text-xs font-bold uppercase tracking-wider">
              <Activity size={12} className="text-indigo-400" />
              Event Stream Log
            </div>
            <div className="divide-y divide-slate-900/60 overflow-y-auto max-h-[310px] flex-1">
              {activities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  type={activity.type}
                  message={activity.message}
                  time={activity.time}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Index Growth Chart (1 col) */}
        <div className="lg:col-span-1">
          <SectionLabel>Log Commit Index Trend</SectionLabel>
          <TrendCard title="Log Commit Indexes" data={logHistory} />
        </div>

      </div>

    </div>
  );
}

export default Dashboard;