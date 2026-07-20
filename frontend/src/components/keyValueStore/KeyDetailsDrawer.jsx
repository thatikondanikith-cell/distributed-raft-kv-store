import React, { useEffect } from "react";
import { X, Server, CheckCircle2, XCircle, Key, Database, Hash, Clock } from "lucide-react";
import KeyHistoryTimeline from "./KeyHistoryTimeline";

function KeyDetailsDrawer({ isOpen, keyData, onClose }) {
  // Prevent body scrolling when the drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!keyData) return null;

  const defaultReplication = {
    "Node 1": true,
    "Node 2": true,
    "Node 3": true,
    "Node 4": true,
    "Node 5": false,
  };

  const replication = keyData.replication || defaultReplication;
  const nodesList = ["Node 1", "Node 2", "Node 3", "Node 4", "Node 5"];

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide-over panel container */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[560px] bg-[#090b14] border-l border-white/[0.03] shadow-[[-8px_0_32px_rgba(0,0,0,0.6)]] flex flex-col z-50 transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.02] bg-[#0c0f1b]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Key size={18} />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-slate-100 font-mono tracking-wide">Key Details</h3>
              <p className="mt-0.5 text-[12px] text-slate-500 font-medium">Telemetry view of key-value state</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-slate-200 text-slate-400 flex items-center justify-center transition-all duration-200 cursor-pointer"
            title="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-7 scroll-gpu">
          {/* Key and Value Blocks */}
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">Key Name</label>
              <div className="bg-slate-950/80 border border-slate-900 rounded-xl px-4.5 py-3.5 font-mono text-[16px] text-indigo-300 select-text">
                {keyData.key}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">Current Value</label>
              <div className="bg-slate-950/80 border border-slate-900 rounded-xl px-4.5 py-4 font-mono text-[14px] text-slate-200 break-all select-text max-h-40 overflow-y-auto">
                {keyData.value}
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Version */}
            <div className="bg-slate-900/30 border border-slate-900/60 rounded-xl p-4 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Hash size={12} className="text-indigo-400" /> Version
              </span>
              <span className="text-[14px] font-mono font-bold text-slate-200">{keyData.version}</span>
            </div>

            {/* Leader Node */}
            <div className="bg-slate-900/30 border border-slate-900/60 rounded-xl p-4 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Server size={12} className="text-amber-400" /> Leader Node
              </span>
              <span className="text-[14px] font-mono font-bold text-slate-200">{keyData.leader}</span>
            </div>

            {/* Created At */}
            <div className="bg-slate-900/30 border border-slate-900/60 rounded-xl p-4 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Clock size={12} className="text-slate-500" /> Created At
              </span>
              <span className="text-[14px] font-mono font-bold text-slate-350">{keyData.createdAt || "N/A"}</span>
            </div>

            {/* Last Updated */}
            <div className="bg-slate-900/30 border border-slate-900/60 rounded-xl p-4 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Clock size={12} className="text-indigo-400" /> Last Updated
              </span>
              <span className="text-[14px] font-mono font-bold text-slate-200">{keyData.lastUpdated}</span>
            </div>
          </div>

          {/* Log Index */}
          <div className="bg-slate-900/30 border border-slate-900/60 rounded-xl p-4 flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Database size={14} className="text-violet-400" /> Current Log Index
            </span>
            <span className="text-[14px] font-mono font-extrabold text-violet-400 bg-violet-500/10 border border-violet-500/15 px-2.5 py-1 rounded-md">
              {keyData.logIndex}
            </span>
          </div>

          {/* Replication Status */}
          <div className="bg-slate-900/30 border border-slate-900/60 rounded-xl p-4.5 flex flex-col gap-4">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block font-sans">
              Replication Status
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {nodesList.map((node) => {
                const isReplicated = !!replication[node];
                return (
                  <div
                    key={node}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-[12px] font-mono font-semibold ${
                      isReplicated
                        ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
                        : "bg-slate-950/40 border-slate-900 text-slate-600"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Server size={12} />
                      {node}
                    </span>
                    {isReplicated ? (
                      <CheckCircle2 size={13} className="text-emerald-400" />
                    ) : (
                      <XCircle size={13} className="text-slate-700" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Horizontal divider */}
          <div className="h-px bg-white/[0.02]" />

          {/* History Timeline */}
          <KeyHistoryTimeline history={keyData.history} />
        </div>
      </div>
    </>
  );
}

export default KeyDetailsDrawer;
