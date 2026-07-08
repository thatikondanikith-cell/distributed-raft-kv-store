import { Database, Crown } from "lucide-react";

function Navbar({ clusterHealth = "Healthy", leaderName = "Node 1" }) {
  const healthThemes = {
    Healthy: {
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/15",
      text: "text-emerald-400",
      dot: "bg-emerald-500",
      label: "CLUSTER HEALTHY",
    },
    Degraded: {
      bg: "bg-amber-500/5",
      border: "border-amber-500/15",
      text: "text-amber-400",
      dot: "bg-amber-500",
      label: "QUORUM DEGRADED",
    },
    Unhealthy: {
      bg: "bg-rose-500/5",
      border: "border-rose-500/15",
      text: "text-rose-400",
      dot: "bg-rose-500",
      label: "QUORUM LOST",
    },
  };

  const theme = healthThemes[clusterHealth] || healthThemes.Healthy;

  return (
    <nav className="w-full h-16 bg-[#0a0c16] border-b border-white/[0.03] shadow-[0_2px_15px_rgba(0,0,0,0.3)] sticky top-0 z-50 px-8 flex items-center justify-between">
      
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
          <Database size={18} />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2">
            Raft KV Store
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800/80 text-slate-400 font-mono tracking-wider uppercase">
              Core
            </span>
          </h1>
        </div>
      </div>

      {/* Cluster Status Pills */}
      <div className="flex items-center gap-3">
        
        {/* Health pill */}
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full ${theme.bg} border ${theme.border} ${theme.text} text-[10px] font-bold tracking-wider font-sans`}>
          <span className="flex h-1.5 w-1.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.dot} opacity-60`}></span>
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${theme.dot}`}></span>
          </span>
          {theme.label}
        </div>

        {/* Leader pill */}
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full ${
          leaderName !== "None" 
            ? "bg-amber-500/5 border border-amber-500/15 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.02)]" 
            : "bg-slate-900/40 border border-slate-800 text-slate-400"
        } text-[10px] font-bold tracking-wider`}>
          <Crown size={11} className={leaderName !== "None" ? "text-amber-400 animate-pulse" : "text-slate-500"} />
          <span>LEADER: {leaderName}</span>
        </div>

      </div>

    </nav>
  );
}

export default Navbar;