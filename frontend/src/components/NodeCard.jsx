import { ChevronRight, Crown, Cpu } from "lucide-react";

function NodeCard({ nodeName, role, status, term, logIndex, onViewDetails }) {
  const isLeader = role === "Leader";
  const isOffline = status === "Offline";
  const isCandidate = role === "Candidate";
  const isRunning = status === "Running" || status === "Online";

  return (
    <div
      onClick={onViewDetails}
      onKeyDown={(event) => {
        if (onViewDetails && (event.key === "Enter" || event.key === " ")) onViewDetails();
      }}
      role={onViewDetails ? "button" : undefined}
      tabIndex={onViewDetails ? 0 : undefined}
      className={`glass-card rounded-2xl p-6 flex flex-col justify-between min-h-[12.5rem] w-full transition-all duration-300 relative ${
        isOffline
          ? "bg-slate-950/40 border-rose-950/30 opacity-60 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
          : isLeader
          ? "bg-slate-900/60 border-amber-500/20 shadow-[0_0_30px_rgba(251,191,36,0.03)]"
          : isCandidate
          ? "bg-slate-900/60 border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.03)]"
          : "bg-slate-900/40 border-slate-900 shadow-[0_8px_32px_rgba(0,0,0,0.15)] hover:border-slate-800"
      } hover:-translate-y-1 ${onViewDetails ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60" : ""}`}
    >
      
      {/* Top Header: Role and status badges */}
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
          {role}
        </span>

        <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
          isRunning
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
            : "bg-rose-500/10 text-rose-400 border-rose-500/25"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" : "bg-rose-400"}`} />
          {status}
        </span>

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

      {onViewDetails && (
        <span className="mt-4 -mb-1 flex items-center justify-between w-full text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 group-hover:text-indigo-300 transition-colors">
          <span>View Details</span><ChevronRight size={14} />
        </span>
      )}

    </div>
  );
}

export default NodeCard;
