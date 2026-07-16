import React from "react";
import { Clock, Database, Search, Trash2, CheckCircle2, XCircle } from "lucide-react";

function RecentOperations({ recentOperations }) {
  const getOpBadge = (op) => {
    switch (op) {
      case "GET":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/15 text-cyan-400 text-[10px] font-bold font-mono tracking-wider">
            <Search size={10} />
            GET
          </span>
        );
      case "DELETE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/15 text-rose-400 text-[10px] font-bold font-mono tracking-wider">
            <Trash2 size={10} />
            DELETE
          </span>
        );
      case "PUT":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 text-[10px] font-bold font-mono tracking-wider">
            <Database size={10} />
            PUT
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    const isSuccess = status === "SUCCESS";
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${
          isSuccess
            ? "bg-emerald-500/5 border border-emerald-500/15 text-emerald-400"
            : "bg-rose-500/5 border border-rose-500/15 text-rose-400"
        }`}
      >
        <span className={`w-1 h-1 rounded-full ${isSuccess ? "bg-emerald-400" : "bg-rose-400"}`} />
        {status}
      </span>
    );
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/[0.02]">
      {/* Header */}
      <div className="bg-slate-950/40 px-6 py-4 border-b border-slate-900 flex items-center gap-2 text-slate-400 font-sans text-xs font-bold uppercase tracking-wider">
        <Clock size={12} className="text-indigo-400" />
        Execution History Log
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/20 border-b border-slate-900/80">
              <th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
                Operation
              </th>
              <th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
                Key
              </th>
              <th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
                Status
              </th>
              <th className="px-6 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/60">
            {recentOperations.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-xs text-slate-600 font-medium">
                  No operations executed yet in this session.
                </td>
              </tr>
            ) : (
              recentOperations.map((op, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-white/[0.01] transition-all duration-300"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getOpBadge(op.operation)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-350">
                    {op.key}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(op.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Clock size={10} className="text-slate-700" />
                      {op.time}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecentOperations;
