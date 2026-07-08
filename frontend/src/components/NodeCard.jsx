import { Crown, Cpu, Power } from "lucide-react";

function NodeCard({ id, nodeName, role, status, term, logIndex, onToggle }) {
  const isLeader = role === "Leader";
  const isOffline = status === "Offline";
  const isCandidate = role === "Candidate";

  return (
    <div
      className={`glass-card rounded-2xl p-6 flex flex-col justify-between min-h-[12.5rem] w-full transition-all duration-300 relative ${
        isOffline
          ? "bg-slate-950/40 border-rose-950/30 opacity-60 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
          : isLeader
          ? "bg-slate-900/60 border-amber-500/20 shadow-[0_0_30px_rgba(251,191,36,0.03)]"
          : isCandidate
          ? "bg-slate-900/60 border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.03)]"
          : "bg-slate-900/40 border-slate-900 shadow-[0_8px_32px_rgba(0,0,0,0.15)] hover:border-slate-800"
      } hover:-translate-y-1`}
    >
      
      {/* Top Header: Role Badge + Power Action */}
      <div className="flex items-center justify-between">
        
        {/* Role Badge */}
        <span
          className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${
            isOffline
              ? "bg-slate-950 text-slate-500 border-slate-900"
              : isLeader
              ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
              : isCandidate
              ? "bg-purple-500/10 text-purple-400 border-purple-500/25"
              : "bg-slate-950 text-slate-400 border-slate-900"
          }`}
        >
          {isLeader ? <Crown size={9} className="text-amber-400" /> : <Cpu size={9} />}
          {isOffline ? "OFFLINE" : role}
        </span>

        {/* Power Toggle Button */}
        <button
          onClick={() => onToggle && onToggle(id)}
          className={`p-2 rounded-xl border transition-all duration-300 cursor-pointer ${
            isOffline
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
              : "bg-slate-950 border-slate-900 text-slate-500 hover:border-rose-500/30 hover:text-rose-400 hover:bg-rose-500/10"
          }`}
          title={isOffline ? "Activate Node" : "Deactivate Node"}
        >
          <Power size={12} />
        </button>

      </div>

      {/* Center Section: Node Info & Telemetry Sparkline */}
      <div className="my-3">
        <div className="flex items-center gap-2">
          <h3 className={`text-base font-extrabold tracking-tight transition-colors ${
            isOffline ? "text-slate-500" : "text-slate-200"
          }`}>
            {nodeName}
          </h3>
          {!isOffline && (
            <span className="flex h-1.5 w-1.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLeader ? "bg-amber-400" : "bg-indigo-400"} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isLeader ? "bg-amber-500" : "bg-indigo-500"}`}></span>
            </span>
          )}
        </div>

        {/* Simulated Telemetry Sparkline */}
        {!isOffline ? (
          <div className="h-6 w-full opacity-35 py-1.5 mt-2">
            <svg viewBox="0 0 100 20" className={`w-full h-full ${isLeader ? "text-amber-400" : isCandidate ? "text-purple-400" : "text-indigo-400"}`}>
              <path
                d="M0,10 Q10,2 20,10 T40,10 T60,10 T80,10 L100,10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="4 2"
              />
            </svg>
          </div>
        ) : (
          <div className="h-6 w-full opacity-10 py-1.5 mt-2">
            <svg viewBox="0 0 100 20" className="w-full h-full text-slate-500">
              <line x1="0" y1="10" x2="100" y2="10" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
          </div>
        )}
      </div>

      {/* Bottom Footer: Stats divide */}
      <div className="grid grid-cols-2 divide-x divide-slate-800/60 border-t border-slate-800/40 pt-3.5 text-slate-400 font-sans">
        <div>
          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Term
          </span>
          <span className={`block text-sm font-extrabold mt-0.5 font-mono ${isOffline ? "text-slate-600" : "text-slate-300"}`}>
            {isOffline ? "—" : term}
          </span>
        </div>
        <div className="pl-3 text-right">
          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Log Index
          </span>
          <span className={`block text-sm font-extrabold mt-0.5 font-mono ${isOffline ? "text-slate-600" : "text-indigo-400"}`}>
            {isOffline ? "—" : logIndex}
          </span>
        </div>
      </div>

    </div>
  );
}

export default NodeCard;