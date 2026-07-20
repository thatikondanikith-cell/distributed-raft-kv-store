import React from "react";
import { Search, RefreshCw } from "lucide-react";

function SearchToolbar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onRefresh,
  isRefreshing,
}) {
  const filters = ["All", "Permanent", "TTL", "Expired"];

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between w-full bg-transparent">
      {/* Search Input Box */}
      <div className="relative w-full sm:max-w-sm md:max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by key..."
          className="w-full bg-slate-950/60 border border-slate-800/90 rounded-xl pl-12 pr-5 py-3.5 text-[15px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/5 font-sans transition-all"
        />
      </div>

      {/* Action Buttons & Filter Group */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Filter Toggle Group */}
        <div className="flex bg-[#070912] border border-white/[0.04] p-1 rounded-xl shadow-inner w-full sm:w-auto">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => onFilterChange(filter)}
                aria-pressed={isActive}
                className={`flex-1 sm:flex-none px-4.5 py-3 rounded-lg text-[11px] font-bold font-mono tracking-wider transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.05)]"
                    : "text-slate-400 hover:text-slate-250 hover:bg-white/[0.01] border border-transparent"
                }`}
              >
                {filter.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Refresh Icon Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900/60 border border-slate-800 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 transition-all duration-250 cursor-pointer shadow-md select-none shrink-0 ${
            isRefreshing ? "opacity-60 cursor-not-allowed" : ""
          }`}
          title="Refresh store"
        >
          <RefreshCw
            size={17}
            className={`${isRefreshing ? "animate-spin text-indigo-400" : "transition-transform hover:rotate-45"}`}
          />
        </button>
      </div>
    </div>
  );
}

export default SearchToolbar;
