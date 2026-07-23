import { useState, useCallback } from "react";
import {
  Network, Zap, ZapOff, ShieldAlert, RotateCcw, GitMerge
} from "lucide-react";
import { createPartition, healPartition } from "../services/api";

const PAIRS = [
  { a: "Node-1", b: "Node-2", labelA: "N1", labelB: "N2", id: "n1-n2" },
  { a: "Node-2", b: "Node-3", labelA: "N2", labelB: "N3", id: "n2-n3" },
  { a: "Node-1", b: "Node-3", labelA: "N1", labelB: "N3", id: "n1-n3" },
];

export default function FailureSimulation({ nodes = [], onActivity }) {
  // Derive partitions from the nodes prop's communicationMaps
  const partitions = {};
  PAIRS.forEach(pair => {
    const nodeAObj = nodes.find(n => `Node-${n.id}` === pair.a);
    const nodeBObj = nodes.find(n => `Node-${n.id}` === pair.b);
    const partitionedA = nodeAObj?.communicationMap?.[pair.b] === false;
    const partitionedB = nodeBObj?.communicationMap?.[pair.a] === false;
    partitions[pair.id] = partitionedA || partitionedB;
  });

  const [loading, setLoading]       = useState({});
  const [logs, setLogs]             = useState([]);

  const addLog = useCallback((type, msg) => {
    setLogs(prev => [
      { id: Date.now(), type, msg, ts: new Date().toLocaleTimeString() },
      ...prev.slice(0, 29),
    ]);
    if (onActivity) onActivity(type, msg);
  }, [onActivity]);

  async function togglePartition(pair) {
    const isPartitioned = !!partitions[pair.id];
    setLoading(l => ({ ...l, [pair.id]: true }));
    try {
      if (isPartitioned) {
        await healPartition(pair.a, pair.b);
        addLog("heal", `Partition healed between ${pair.a} ↔ ${pair.b}`);
      } else {
        await createPartition(pair.a, pair.b);
        addLog("partition", `Network partition created: ${pair.a} ✂ ${pair.b}`);
      }
    } catch (err) {
      addLog("error", err.message);
    } finally {
      setLoading(l => ({ ...l, [pair.id]: false }));
    }
  }

  async function healAll() {
    for (const pair of PAIRS) {
      if (partitions[pair.id]) {
        try {
          await healPartition(pair.a, pair.b);
          addLog("heal", `Healed ${pair.a} ↔ ${pair.b}`);
        } catch (err) {
          addLog("error", err.message);
        }
      }
    }
  }

  const activePartitions = PAIRS.filter(p => partitions[p.id]).length;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-7">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-theme">
        <div>
          <h1 className="text-2xl font-extrabold text-theme-primary tracking-tight">
            Failure Simulation
          </h1>
          <p className="mt-1 text-xs text-theme-muted">
            Inject network partitions between Raft cluster nodes to observe consensus behaviour.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activePartitions > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-500 text-[10px] font-extrabold uppercase tracking-wider">
              <ShieldAlert size={11} />
              {activePartitions} Active Partition{activePartitions > 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={healAll}
            disabled={activePartitions === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider hover:bg-emerald-500/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <RotateCcw size={11} /> Heal All
          </button>
        </div>
      </div>

      {/* Partition topology cards */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="w-1 h-5 bg-rose-500 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.6)]" />
          <h2 className="text-sm font-extrabold text-theme-primary uppercase tracking-wider">
            Node Connection Links
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {PAIRS.map(pair => {
            const broken = !!partitions[pair.id];
            const busy   = !!loading[pair.id];
            return (
              <div
                key={pair.id}
                className={`glass-card rounded-2xl p-6 flex flex-col gap-5 transition-all duration-300 ${
                  broken
                    ? "border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.06)]"
                    : "border-emerald-500/15 shadow-[0_0_30px_rgba(16,185,129,0.04)]"
                }`}
              >
                {/* Visual link diagram */}
                <div className="flex items-center justify-between">
                  <NodePill label={pair.labelA} nodes={nodes} nodeKey={pair.a} />
                  <div className="flex-1 flex flex-col items-center gap-1 px-3">
                    {broken ? (
                      <>
                        <div className="flex items-center gap-1 w-full">
                          <div className="flex-1 h-px border-t-2 border-dashed border-rose-500/40" />
                          <ZapOff size={14} className="text-rose-500 shrink-0" />
                          <div className="flex-1 h-px border-t-2 border-dashed border-rose-500/40" />
                        </div>
                        <span className="text-[9px] font-extrabold text-rose-500 uppercase tracking-widest">Partitioned</span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1 w-full">
                          <div className="flex-1 h-px bg-emerald-500/30" />
                          <Zap size={12} className="text-emerald-500 shrink-0" />
                          <div className="flex-1 h-px bg-emerald-500/30" />
                        </div>
                        <span className="text-[9px] font-extrabold text-emerald-500 uppercase tracking-widest">Connected</span>
                      </>
                    )}
                  </div>
                  <NodePill label={pair.labelB} nodes={nodes} nodeKey={pair.b} />
                </div>

                {/* Action button */}
                <button
                  id={`partition-toggle-${pair.id}`}
                  onClick={() => togglePartition(pair)}
                  disabled={busy}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border font-bold text-[10px] font-mono tracking-wider uppercase transition-all duration-200 cursor-pointer disabled:opacity-60 ${
                    broken
                      ? "bg-emerald-500/8 border-emerald-500/25 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
                      : "bg-rose-500/8 border-rose-500/25 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15"
                  }`}
                >
                  {busy ? (
                    <span className="animate-pulse">Working…</span>
                  ) : broken ? (
                    <><GitMerge size={11} /> Heal Partition</>
                  ) : (
                    <><ZapOff size={11} /> Create Partition</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Node Health Summary */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-1 h-5 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
          <h2 className="text-sm font-extrabold text-theme-primary uppercase tracking-wider">
            Live Node Health
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {nodes.map(n => {
            const h = n.health ?? (n.status === "Online" ? 100 : 0);
            const bar = Math.max(4, h);
            const color = h === 100 ? "bg-emerald-500" : h > 0 ? "bg-amber-500" : "bg-rose-500";
            const textColor = h === 100 ? "text-emerald-500" : h > 0 ? "text-amber-500" : "text-rose-500";
            return (
              <div key={n.id} className="bg-theme-base rounded-xl p-4 border border-theme flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-theme-primary">{n.nodeName}</span>
                  <span className={`text-xs font-extrabold font-mono ${textColor}`}>{h}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-theme-surface overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${color}`}
                    style={{ width: `${bar}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
                  <span className="text-theme-muted">{n.role}</span>
                  <span className={n.status === "Online" ? "text-emerald-500" : "text-rose-500"}>
                    {n.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event log */}
      {logs.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-1 h-5 bg-amber-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
            <h2 className="text-sm font-extrabold text-theme-primary uppercase tracking-wider">Simulation Log</h2>
          </div>
          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
            {logs.map(l => (
              <div key={l.id} className="flex items-start gap-3 text-xs">
                <span className="text-theme-muted font-mono shrink-0 mt-0.5">{l.ts}</span>
                <span className={`font-bold shrink-0 ${
                  l.type === "partition" ? "text-rose-500" :
                  l.type === "heal"      ? "text-emerald-500" : "text-amber-500"
                }`}>
                  {l.type.toUpperCase()}
                </span>
                <span className="text-theme-secondary">{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NodePill({ label, nodes, nodeKey }) {
  const n = nodes.find(nd => `Node-${nd.id}` === nodeKey);
  const online = n ? n.status === "Online" : true;
  return (
    <div className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl border text-center min-w-[52px] ${
      online ? "bg-indigo-500/8 border-indigo-500/20 text-indigo-500" : "bg-rose-500/8 border-rose-500/20 text-rose-400"
    }`}>
      <span className="text-xs font-extrabold tracking-wider">{label}</span>
      <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
    </div>
  );
}
