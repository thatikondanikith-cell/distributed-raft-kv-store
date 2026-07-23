import { Server, Power, PowerOff } from "lucide-react";
import NodeCard from "../components/NodeCard";
import { useNavigate } from "react-router-dom";

function Nodes({ nodes = [], onToggleNode }) {
  const navigate = useNavigate();

  const onlineCount = nodes.filter((n) => n.status === "Online").length;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-7">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-white/[0.03]">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Cluster Nodes</h1>
          <p className="mt-1 text-xs text-slate-500">
            Browse Raft cluster members, inspect consensus state, and manage node health.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/5 border border-indigo-500/15 text-[10px] text-indigo-400 font-extrabold font-mono tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          {onlineCount} / {nodes.length} NODES ONLINE
        </div>
      </div>

      {/* Node Cards Grid */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="w-1 h-5 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
          <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider">Cluster Members</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {nodes.map((node) => (
            <div key={node.id} className="flex flex-col gap-3">
              <NodeCard
                nodeName={node.nodeName}
                role={node.role}
                status={node.status}
                term={node.term}
                logIndex={node.logIndex}
                onViewDetails={() => navigate(`/nodes/${node.id}`)}
              />

              {/* Health Control: Crash / Recover button */}
              {onToggleNode && (
                <button
                  id={`node-health-toggle-${node.id}`}
                  onClick={() => onToggleNode(node.id)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-[10px] font-mono tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                    node.status === "Online"
                      ? "bg-rose-500/5 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:shadow-[0_0_15px_rgba(244,63,94,0.08)]"
                      : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                  }`}
                >
                  {node.status === "Online" ? (
                    <>
                      <PowerOff size={11} />
                      Crash Node
                    </>
                  ) : (
                    <>
                      <Power size={11} />
                      Recover Node
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Node Health Summary Bar */}
      <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
        <span className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 grid place-items-center shrink-0">
          <Server size={15} />
        </span>
        <div className="flex-1">
          <p className="text-xs text-slate-400 font-medium">
            Select a node card to review replication progress, its append-only log, and runtime metrics.
          </p>
          <div className="flex items-center gap-4 mt-2">
            {nodes.map((node) => (
              <div key={node.id} className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    node.status === "Online"
                      ? node.role === "Leader"
                        ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                        : "bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.6)]"
                      : "bg-rose-400"
                  }`}
                />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {node.nodeName}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider ${
                    node.status === "Online" ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {node.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

export default Nodes;
