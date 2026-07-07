import { Crown, Cpu } from "lucide-react";

function NodeCard({ nodeName, role, status, term, logIndex }) {
  const isLeader = role === "Leader";

  return (
    <div
      className={`w-44 h-44 flex flex-col justify-between bg-white/70 backdrop-blur-md border rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_15px_35px_rgba(99,102,241,0.08)] hover:-translate-y-1.5 transition-all duration-300 ${
        isLeader
          ? "border-amber-300/80 ring-1 ring-amber-100/50"
          : "border-slate-200/70"
      }`}
    >
      {/* Top Header: Role Badge + Status Indicator */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            isLeader
              ? "bg-amber-50/90 text-amber-700 border border-amber-200/50"
              : "bg-slate-50/90 text-slate-500 border border-slate-200/50"
          }`}
        >
          {isLeader ? <Crown size={8} /> : <Cpu size={8} />}
          {role}
        </span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-bold text-emerald-600 uppercase font-mono">{status}</span>
        </div>
      </div>

      {/* Center Section: Node Name */}
      <div className="my-auto py-1">
        <h3 className="text-base font-bold text-slate-800 tracking-tight">{nodeName}</h3>
        <p className="text-[9px] font-medium text-slate-400">
          {isLeader ? "Consensus Authority" : "Replicated Replica"}
        </p>
      </div>

      {/* Bottom Footer: Stats Stack */}
      <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100/80 pt-2.5 text-slate-500">
        <div>
          <span className="block text-[8px] font-bold text-slate-400 uppercase font-mono">Term</span>
          <span className="block text-[11px] font-mono font-bold text-slate-700 mt-0.5">{term}</span>
        </div>
        <div className="pl-2 text-right">
          <span className="block text-[8px] font-bold text-slate-400 uppercase font-mono">Log Index</span>
          <span className="block text-[11px] font-mono font-bold text-slate-700 mt-0.5">{logIndex}</span>
        </div>
      </div>
    </div>
  );
}

export default NodeCard;