import React from "react";

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  startIndex,
  endIndex,
  totalItems,
}) {
  if (totalItems === 0) return null;

  return (
    <div className="mt-auto flex items-center justify-between gap-4 px-8 py-5 border-t border-slate-800/70 bg-slate-950/30 select-none">
      {/* Informational Text */}
      <div className="text-[13px] font-semibold font-mono text-slate-500 tabular-nums">
        SHOWING <span className="text-slate-350">{startIndex + 1}</span>–
        <span className="text-slate-350">{Math.min(endIndex, totalItems)}</span> OF{" "}
        <span className="text-indigo-400 glow-text-indigo">{totalItems}</span> KEYS
      </div>

      {/* Button controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4.5 py-2.5 rounded-lg border border-slate-800 text-[11px] font-extrabold font-mono tracking-wider text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
        >
          PREV
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-4.5 py-2.5 rounded-lg border border-slate-800 text-[11px] font-extrabold font-mono tracking-wider text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
        >
          NEXT
        </button>
      </div>
    </div>
  );
}

export default Pagination;
