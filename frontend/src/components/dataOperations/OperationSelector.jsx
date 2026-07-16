import React from "react";
import { Database, Search, Trash2 } from "lucide-react";

function OperationSelector({ selectedOperation, onSelectOperation }) {
  const operations = [
    { id: "PUT", label: "PUT", icon: <Database size={13} />, activeColor: "bg-indigo-600 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]" },
    { id: "GET", label: "GET", icon: <Search size={13} />, activeColor: "bg-cyan-600 border-cyan-500 shadow-[0_0_15px_rgba(8,145,178,0.2)]" },
    { id: "DELETE", label: "DELETE", icon: <Trash2 size={13} />, activeColor: "bg-rose-600 border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.2)]" },
  ];

  return (
    <div className="flex bg-[#070912] border border-white/[0.03] p-1 rounded-2xl max-w-md w-full shadow-inner">
      {operations.map((op) => {
        const isActive = selectedOperation === op.id;
        return (
          <button
            key={op.id}
            type="button"
            onClick={() => onSelectOperation(op.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-mono font-extrabold tracking-wider transition-all duration-300 cursor-pointer ${
              isActive
                ? `${op.activeColor} text-white border`
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent"
            }`}
          >
            <span className={isActive ? "text-white" : "text-slate-500"}>
              {op.icon}
            </span>
            {op.label}
          </button>
        );
      })}
    </div>
  );
}

export default OperationSelector;
