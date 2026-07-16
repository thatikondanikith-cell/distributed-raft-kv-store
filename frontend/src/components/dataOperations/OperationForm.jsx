import React from "react";
import { Terminal, Database, Search, Trash2 } from "lucide-react";

function OperationForm({
  selectedOperation,
  inputKey,
  inputValue,
  onKeyChange,
  onValueChange,
  onSubmit,
  loading,
}) {
  const getTheme = () => {
    switch (selectedOperation) {
      case "GET":
        return {
          btnStyle: "bg-cyan-600 border-cyan-500 hover:bg-cyan-500 shadow-[0_0_15px_rgba(8,145,178,0.15)]",
          btnLoadingStyle: "bg-cyan-500/20 border-cyan-500/30 text-cyan-400 opacity-60 cursor-not-allowed animate-pulse",
          btnText: "EXECUTE GET",
          icon: <Search size={16} className="text-cyan-400" />,
          focusColor: "focus:border-cyan-500/50"
        };
      case "DELETE":
        return {
          btnStyle: "bg-rose-600 border-rose-500 hover:bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.15)]",
          btnLoadingStyle: "bg-rose-500/20 border-rose-500/30 text-rose-400 opacity-60 cursor-not-allowed animate-pulse",
          btnText: "EXECUTE DELETE",
          icon: <Trash2 size={16} className="text-rose-400" />,
          focusColor: "focus:border-rose-500/50"
        };
      case "PUT":
      default:
        return {
          btnStyle: "bg-indigo-600 border-indigo-500 hover:bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]",
          btnLoadingStyle: "bg-indigo-500/20 border-indigo-500/30 text-indigo-400 opacity-60 cursor-not-allowed animate-pulse",
          btnText: "EXECUTE PUT",
          icon: <Database size={16} className="text-indigo-400" />,
          focusColor: "focus:border-indigo-500/50"
        };
    }
  };

  const theme = getTheme();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading) {
      onSubmit();
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col gap-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border-t border-white/[0.02]">
      {/* Form Header */}
      <div>
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 font-mono">
          {theme.icon}
          State Operation: {selectedOperation}
        </h3>
        <p className="text-xs text-slate-500 mt-1 font-medium font-sans">
          {selectedOperation === "PUT" && "Write or update a key-value entry in the distributed KV store."}
          {selectedOperation === "GET" && "Retrieve the value associated with a key from the distributed KV store."}
          {selectedOperation === "DELETE" && "Remove a key-value pair permanently from the distributed KV store."}
        </p>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          
          {/* Key Input */}
          <div className="flex-1 flex flex-col gap-1.5 w-full">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide font-sans">
              Key
            </label>
            <input
              type="text"
              value={inputKey}
              onChange={(e) => onKeyChange(e.target.value)}
              placeholder="e.g. session_id"
              className={`bg-slate-950/60 border border-slate-900 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none ${theme.focusColor} font-mono transition-all w-full`}
              required
              disabled={loading}
            />
          </div>

          {/* Value Input (Only for PUT) */}
          {selectedOperation === "PUT" && (
            <div className="flex-1 flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide font-sans">
                Value
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => onValueChange(e.target.value)}
                placeholder="e.g. auth_user_99"
                className={`bg-slate-950/60 border border-slate-900 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none ${theme.focusColor} font-mono transition-all w-full`}
                required
                disabled={loading}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !inputKey || (selectedOperation === "PUT" && !inputValue)}
            className={`px-6 py-2.5 rounded-xl border font-bold text-xs font-mono tracking-wider transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer ${
              loading
                ? theme.btnLoadingStyle
                : !inputKey || (selectedOperation === "PUT" && !inputValue)
                ? "bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed opacity-50"
                : `${theme.btnStyle} text-white cursor-pointer`
            }`}
          >
            {loading && (
              <svg
                className="animate-spin h-3.5 w-3.5 text-current"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {loading ? "EXECUTING..." : theme.btnText}
          </button>
        </div>
      </form>
    </div>
  );
}

export default OperationForm;
