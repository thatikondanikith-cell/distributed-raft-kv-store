import React from "react";
import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

function ResponseCard({ response }) {
  if (!response) {
    return (
      <div className="glass-card border-t-2 border-t-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[9rem] text-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] border-white/[0.02]">
        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-2">
          <HelpCircle size={18} />
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
          Awaiting Execution
        </span>
        <p className="text-[11px] text-slate-600 mt-1 font-medium font-sans">
          Select an operation, input key/value parameter, and execute to see results here.
        </p>
      </div>
    );
  }

  const isSuccess = response.status === "SUCCESS";
  const borderColor = isSuccess ? "border-t-emerald-500/80" : "border-t-rose-500/80";
  const statusBg = isSuccess ? "bg-emerald-500/10" : "bg-rose-500/10";
  const statusText = isSuccess ? "text-emerald-400" : "text-rose-400";
  const valueColor = isSuccess ? "text-slate-200" : "text-slate-500";
  const statusLabel = isSuccess ? `SUCCESS (${response.statusCode || 200})` : `FAILURE (${response.statusCode || 400})`;

  return (
    <div className={`glass-card border-t-2 ${borderColor} rounded-2xl p-6 flex flex-col gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border-white/[0.02]`}>
      
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 tracking-wide uppercase font-sans">
          Execution Response
        </span>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${statusBg} ${statusText} border border-white/5 text-[10px] font-bold font-mono tracking-wider`}>
          {isSuccess ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
          {statusLabel}
        </div>
      </div>

      {/* Message */}
      <div className="mt-1">
        <p className={`text-xs font-semibold ${isSuccess ? "text-slate-300" : "text-rose-350"}`}>
          {response.message}
        </p>
      </div>

      {/* Key-Value Detail Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-900/60">
        
        {/* Key Detail */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
            Key
          </span>
          <div className="font-mono text-xs px-3 py-2 bg-slate-950/60 border border-slate-900 rounded-xl text-indigo-400 overflow-x-auto">
            {response.key || <span className="text-slate-700 italic">None</span>}
          </div>
        </div>

        {/* Value Detail */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
            Value
          </span>
          <div className={`font-mono text-xs px-3 py-2 bg-slate-950/60 border border-slate-900 rounded-xl ${valueColor} overflow-x-auto`}>
            {response.value !== null && response.value !== undefined ? (
              response.value
            ) : (
              <span className="text-slate-700 italic">None / Deleted</span>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

export default ResponseCard;
