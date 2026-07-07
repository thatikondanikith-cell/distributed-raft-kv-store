import { Database, Crown } from "lucide-react";

function Navbar() {
  return (
    <nav className="w-full h-14 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="w-full h-full flex items-center justify-between px-6">

        {/* Left Section */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
            <Database size={17} />
          </div>
          <h1 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Raft KV Store
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
              Console
            </span>
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">

          {/* Cluster Health */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Cluster Healthy
          </div>

          {/* Leader */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
            <Crown size={12} className="text-amber-500" />
            <span>Leader: Node 1</span>
          </div>

        </div>

      </div>
    </nav>
  );
}

export default Navbar;