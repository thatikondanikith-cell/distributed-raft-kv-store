import { Database, Crown, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

function Navbar({ clusterHealth = "Healthy", leaderName = "Node 1", nodes = [], onLogout }) {
  const { theme, toggleTheme } = useTheme();

  const healthThemes = {
    Healthy:   { bg: "bg-emerald-500/5", border: "border-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", label: "CLUSTER HEALTHY" },
    Degraded:  { bg: "bg-amber-500/5",   border: "border-amber-500/15",   text: "text-amber-600 dark:text-amber-400",   dot: "bg-amber-500",   label: "QUORUM DEGRADED" },
    Unhealthy: { bg: "bg-rose-500/5",    border: "border-rose-500/15",    text: "text-rose-600 dark:text-rose-400",     dot: "bg-rose-500",    label: "QUORUM LOST"     },
  };
  const th = healthThemes[clusterHealth] || healthThemes.Healthy;

  const email = localStorage.getItem("raft_email") || "";

  return (
    <nav className="w-full h-16 bg-theme-surface border-b border-theme shadow-[0_2px_12px_rgba(0,0,0,0.06)] sticky top-0 z-50 px-6 flex items-center justify-between transition-colors duration-200 gap-3">

      {/* ── Brand ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-[0_0_16px_rgba(99,102,241,0.08)]">
          <Database size={18} />
        </div>
        <h1 className="text-sm font-bold text-theme-primary tracking-tight flex items-center gap-2">
          Raft KV Store
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-theme-base border border-theme text-theme-secondary font-mono tracking-wider uppercase">Core</span>
        </h1>
      </div>

      {/* ── Right group ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0 overflow-x-auto">

        {/* Node Health widget */}
        {nodes.length > 0 && (
          <div className="hidden xl:flex items-center gap-0 bg-theme-base border border-theme rounded-full px-3 py-1.5 text-[10px] font-bold tracking-wider shrink-0">
            <span className="text-theme-muted text-[9px] font-mono tracking-widest mr-2.5">NODES:</span>
            {nodes.map((n, i) => {
              const h = n.health ?? (n.status === "Online" ? 100 : 0);
              const dot  = h === 100 ? "bg-emerald-500" : h > 0 ? "bg-amber-500" : "bg-rose-500";
              const text = h === 100 ? "text-emerald-500" : h > 0 ? "text-amber-500" : "text-rose-500";
              return (
                <div key={n.id} className={`flex items-center gap-1.5 ${i < nodes.length - 1 ? "border-r border-theme pr-2.5 mr-2.5" : ""}`}>
                  <span className="text-theme-secondary font-mono">N{n.id}</span>
                  <span className="relative flex h-1.5 w-1.5">
                    {n.status === "Online" && h > 0 && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot} opacity-75`} />}
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dot}`} />
                  </span>
                  <span className={`${text} font-mono font-extrabold`}>{h}%</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Cluster health pill */}
        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full ${th.bg} border ${th.border} ${th.text} text-[10px] font-bold tracking-wider shrink-0`}>
          <span className="flex h-1.5 w-1.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${th.dot} opacity-60`} />
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${th.dot}`} />
          </span>
          {th.label}
        </div>

        {/* Leader pill */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold tracking-wider shrink-0 ${
          leaderName !== "None"
            ? "bg-amber-500/5 border-amber-500/15 text-amber-600 dark:text-amber-400"
            : "bg-theme-base border-theme text-theme-secondary"
        }`}>
          <Crown size={11} className={leaderName !== "None" ? "text-amber-500 animate-pulse" : "text-theme-muted"} />
          LEADER: {leaderName}
        </div>

        {/* ── Sliding Segmented Theme Toggle ───────────────────────── */}
        <div
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="relative flex items-center bg-theme-base border border-theme rounded-full p-0.5 select-none w-[6.5rem] h-7 text-[9px] font-bold tracking-wider uppercase cursor-pointer shrink-0 transition-colors duration-200"
        >
          {/* Sliding capsule */}
          <div className={`absolute top-0.5 bottom-0.5 rounded-full transition-all duration-300 ${
            theme === "dark"
              ? "left-[calc(50%+1px)] right-0.5 bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]"
              : "left-0.5 right-[calc(50%+1px)] bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
          }`} />
          <div className={`flex-1 flex items-center justify-center gap-1 z-10 transition-colors duration-200 ${theme === "light" ? "text-white" : "text-theme-muted"}`}>
            <Sun size={10} /><span>Light</span>
          </div>
          <div className={`flex-1 flex items-center justify-center gap-1 z-10 transition-colors duration-200 ${theme === "dark" ? "text-white" : "text-theme-muted"}`}>
            <Moon size={10} /><span>Dark</span>
          </div>
        </div>

        {/* Logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            title={`Logout${email ? ` (${email})` : ""}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-theme-base border border-theme text-theme-muted hover:text-rose-500 hover:border-rose-500/30 text-[9px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0"
          >
            <LogOut size={11} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;