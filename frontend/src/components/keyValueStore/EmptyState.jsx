import React from "react";
import { Database, Search } from "lucide-react";

function EmptyState({ searchQuery, activeFilter }) {
  const isFiltered = searchQuery || activeFilter !== "All";

  return (
    <div className="glass-card rounded-2xl border border-white/[0.02] p-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto my-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] select-none">
      {/* Decorative Outer Glow Circle */}
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 flex items-center justify-center text-indigo-400 mb-6 shadow-[0_0_25px_rgba(99,102,241,0.08)] relative">
        {/* Glowing aura */}
        <div className="absolute inset-0 rounded-2xl bg-indigo-500/5 animate-ping opacity-30" />
        
        {isFiltered ? (
          <Search size={24} className="text-indigo-400" />
        ) : (
          <Database size={24} className="text-indigo-400" />
        )}
      </div>

      <h3 className="text-base font-extrabold text-slate-200 tracking-tight">
        {isFiltered ? "No Matches Found" : "Database Empty"}
      </h3>
      
      <p className="mt-2 text-xs text-slate-500 max-w-xs leading-relaxed font-medium">
        {isFiltered
          ? `We couldn't find any key-value pairs matching "${searchQuery || activeFilter}". Try adjusting your query.`
          : "No key-value pairs found in the distributed cluster state. Write a key first."}
      </p>
    </div>
  );
}

export default EmptyState;
