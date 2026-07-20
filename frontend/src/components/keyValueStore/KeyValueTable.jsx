import React from "react";
import { Server, Clock, ChevronRight } from "lucide-react";
import TTLProgress from "./TTLProgress";

function KeyValueTable({ keys = [], onRowClick, selectedRowKey }) {
  if (keys.length === 0) return null;

  return (
    <div className="w-full flex-1 min-h-0">
      {/* 1. Desktop & Tablet View (Horizontal Table Layout) */}
      <div className="hidden md:flex h-full flex-col">
        <div className="overflow-auto scroll-gpu flex-1 min-h-0">
          <table className="w-full min-w-[920px] text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-[#0b0d18] shadow-[0_1px_0_rgba(30,41,59,0.7)]">
              <tr className="bg-slate-950/30 border-b border-slate-800/80 select-none">
                <th className="w-[17%] px-8 py-5 text-[12px] font-extrabold text-slate-300 uppercase tracking-[0.12em] font-sans">
                  Key
                </th>
                <th className="w-[28%] px-8 py-5 text-[12px] font-extrabold text-slate-300 uppercase tracking-[0.12em] font-sans">
                  Value
                </th>
                <th className="w-[11%] px-8 py-5 text-[12px] font-extrabold text-slate-300 uppercase tracking-[0.12em] font-sans text-center">
                  Version
                </th>
                <th className="w-[14%] px-8 py-5 text-[12px] font-extrabold text-slate-300 uppercase tracking-[0.12em] font-sans">
                  Leader
                </th>
                <th className="w-[17%] px-8 py-5 text-[12px] font-extrabold text-slate-300 uppercase tracking-[0.12em] font-sans">
                  TTL
                </th>
                <th className="w-[13%] px-8 py-5 text-[12px] font-extrabold text-slate-300 uppercase tracking-[0.12em] font-sans">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {keys.map((item) => {
                const isSelected = selectedRowKey === item.key;
                return (
                  <tr
                    key={item.key}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-500/5 hover:bg-indigo-500/8 border-l-2 border-indigo-500"
                        : "hover:bg-slate-800/25"
                    }`}
                  >
                    {/* Key Column */}
                    <td className="px-8 py-5 whitespace-nowrap font-mono text-[15px] font-semibold text-indigo-300">
                      {item.key}
                    </td>

                    {/* Value Column */}
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="max-w-[330px] truncate text-[14px] font-mono text-slate-200 bg-slate-950/40 px-3.5 py-2 rounded-md border border-slate-800/70 select-all" title={item.value}>
                        {item.value}
                      </div>
                    </td>

                    {/* Version Column */}
                    <td className="px-8 py-5 whitespace-nowrap text-center">
                      <span className="inline-flex min-h-7 items-center text-[11px] font-bold font-mono px-3 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800/80">
                        {item.version}
                      </span>
                    </td>

                    {/* Leader Column */}
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="inline-flex min-h-7 items-center gap-1.5 px-3 py-0.5 rounded-md bg-amber-500/5 border border-amber-500/15 text-amber-400 text-[11px] font-bold font-mono tracking-wider">
                        <Server size={12} />
                        {item.leader}
                      </span>
                    </td>

                    {/* TTL Column */}
                    <td className="px-8 py-5 whitespace-nowrap">
                      <TTLProgress
                        ttlType={item.ttlType}
                        ttlSecondsRemaining={item.ttlSecondsRemaining}
                        ttlTotalSeconds={item.ttlTotalSeconds}
                        ttl={item.ttl}
                      />
                    </td>

                    {/* Last Updated Column */}
                    <td className="px-8 py-5 whitespace-nowrap text-[13px] font-mono text-slate-500">
                      <span className="flex items-center gap-2">
                        <Clock size={13} className="text-slate-700" />
                        {item.lastUpdated}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Mobile & Small Screen View (Vertical Cards List Layout) */}
      <div className="md:hidden flex flex-col gap-3">
        {keys.map((item) => {
          const isSelected = selectedRowKey === item.key;
          return (
            <div
              key={item.key}
              onClick={() => onRowClick && onRowClick(item)}
              className={`glass-card rounded-2xl p-4.5 border transition-all duration-200 cursor-pointer flex flex-col gap-3 ${
                isSelected
                  ? "border-indigo-500/30 bg-indigo-500/5"
                  : "border-white/[0.02] hover:border-slate-800"
              }`}
            >
              {/* Header: Key & Version & Chevron */}
              <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-xs font-bold text-indigo-300">{item.key}</span>
                  <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                    <Clock size={8} /> Updated: {item.lastUpdated}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800/80">
                    {item.version}
                  </span>
                  <ChevronRight size={14} className="text-slate-600" />
                </div>
              </div>

              {/* Value Box */}
              <div className="text-[10px] font-mono text-slate-350 bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-900/60 break-all select-all">
                {item.value}
              </div>

              {/* Footer row: Leader Node & TTL */}
              <div className="flex items-center justify-between border-t border-slate-900/60 pt-2.5 mt-0.5">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/5 border border-amber-500/10 text-amber-400 text-[9px] font-bold font-mono">
                  <Server size={8} />
                  {item.leader}
                </div>
                <div className="w-2/3 flex justify-end">
                  <TTLProgress
                    ttlType={item.ttlType}
                    ttlSecondsRemaining={item.ttlSecondsRemaining}
                    ttlTotalSeconds={item.ttlTotalSeconds}
                    ttl={item.ttl}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default KeyValueTable;
