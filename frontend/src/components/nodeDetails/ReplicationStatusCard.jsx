import { Radio, Server } from "lucide-react";

const statusClasses = { "In Sync": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", "Catching Up": "bg-amber-500/10 text-amber-400 border-amber-500/20", Offline: "bg-rose-500/10 text-rose-400 border-rose-500/20" };

function ReplicationStatusCard({ replicationStatus }) {
  return <div className="glass-card rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
    <div className="px-5 py-4 border-b border-slate-900 flex items-center gap-2"><Radio size={14} className="text-indigo-400" /><div><h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Replication Status</h2><p className="text-[10px] text-slate-500 mt-0.5">Peer synchronization overview</p></div></div>
    <div className="p-3">
      {replicationStatus.map((peer) => <div key={peer.name} className="flex items-center justify-between gap-3 px-3 py-4 border-b border-slate-900/60 last:border-0">
        <div className="flex items-center gap-3 min-w-0"><span className="w-8 h-8 rounded-xl bg-slate-950 border border-white/[0.04] grid place-items-center text-indigo-400"><Server size={14} /></span><div><p className="text-xs font-bold text-slate-300">{peer.name}</p><p className="text-[10px] text-slate-500 font-mono mt-0.5">LOG INDEX {peer.logIndex}</p></div></div>
        <span className={`shrink-0 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusClasses[peer.status]}`}>{peer.status}</span>
      </div>)}
    </div>
  </div>;
}
export default ReplicationStatusCard;
