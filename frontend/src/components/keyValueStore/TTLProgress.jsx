import React from "react";

function TTLProgress({ ttlType, ttlSecondsRemaining, ttlTotalSeconds, ttl }) {
  if (ttlType === "permanent" || ttl === "Permanent") {
    return (
      <span className="inline-flex min-h-7 items-center px-3 py-0.5 rounded-md bg-slate-900/60 border border-slate-800 text-slate-400 text-[11px] font-extrabold tracking-wider font-mono">
        PERMANENT
      </span>
    );
  }

  if (ttlType === "expired" || ttl === "Expired") {
    return (
      <span className="inline-flex min-h-7 items-center px-3 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/15 text-rose-400 text-[11px] font-extrabold tracking-wider font-mono animate-pulse">
        EXPIRED
      </span>
    );
  }

  // Fallback if seconds parameters are missing but ttl string is provided
  const remaining = ttlSecondsRemaining !== undefined ? ttlSecondsRemaining : 0;
  const total = ttlTotalSeconds !== undefined ? ttlTotalSeconds : 60;
  const percentage = total > 0 ? Math.max(0, Math.min(100, Math.round((remaining / total) * 100))) : 0;

  return (
    <div className="flex flex-col gap-2 w-full max-w-[180px] select-none">
      <div className="flex justify-between items-center text-[11px] font-bold font-mono tabular-nums">
        <span className="text-slate-400">{percentage}% remaining</span>
        <span className={`${
          percentage < 25 ? "text-rose-400 font-extrabold" : percentage < 50 ? "text-amber-400" : "text-indigo-400"
        }`}>
          {ttl}
        </span>
      </div>
      <div className="w-full h-2.5 bg-slate-950/80 rounded-full overflow-hidden border border-white/[0.03]">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            percentage < 25
              ? "bg-gradient-to-r from-rose-600 to-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
              : percentage < 50
              ? "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
              : "bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default TTLProgress;
