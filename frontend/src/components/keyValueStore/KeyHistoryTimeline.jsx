import React from "react";
import { History, GitCommit } from "lucide-react";

function KeyHistoryTimeline({ history = [] }) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-7 text-[14px] text-slate-500 font-sans border border-slate-900/40 rounded-xl bg-slate-950/20">
        No version history available.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5 mb-1">
        <History size={16} className="text-indigo-400" />
        <h4 className="text-[14px] font-bold text-slate-350 uppercase tracking-wider font-mono">
          State Version History
        </h4>
      </div>

      <div className="relative pl-7 flex flex-col gap-5 select-none">
        {/* Continuous vertical timeline dashed line */}
        <div className="absolute left-[13px] top-3 bottom-4 w-0.5 border-l border-dashed border-slate-800" />

        {history.map((item, index) => {
          const isLatest = index === history.length - 1;
          return (
            <div key={item.version || index} className="relative group">
              {/* Timeline Bullet Node Icon */}
              <div className={`absolute -left-[24px] top-2 w-7 h-7 rounded-full bg-slate-950 border flex items-center justify-center transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.6)] ${
                isLatest
                  ? "border-indigo-500/40 text-indigo-400"
                  : "border-slate-800 text-slate-600 group-hover:text-slate-400 group-hover:border-slate-700"
              }`}>
                <GitCommit size={13} className={isLatest ? "animate-pulse" : ""} />
              </div>

              {/* Version Detail Card Box */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${
                isLatest
                  ? "bg-indigo-500/5 border-indigo-500/15 shadow-[0_4px_15px_rgba(99,102,241,0.03)]"
                  : "bg-slate-900/30 border-slate-900/60 hover:border-slate-800/80"
              }`}>
                {/* Header details */}
                <div className="flex justify-between items-center gap-2 mb-3">
                  <span className={`text-[11px] font-extrabold font-mono px-2 py-1 rounded-md tracking-wide ${
                    isLatest
                      ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25"
                      : "bg-slate-850 text-slate-400 border border-slate-800"
                  }`}>
                    {item.version ? item.version.toUpperCase() : `V${index + 1}`}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                    <span>INDEX {item.logIndex}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                  </div>
                </div>

                {/* Operation command display */}
                <div className="text-[13px] font-mono text-slate-350 bg-slate-950/60 px-3.5 py-2.5 rounded-lg border border-slate-900/80 break-all select-text selection:bg-indigo-500/30">
                  {item.op}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default KeyHistoryTimeline;
