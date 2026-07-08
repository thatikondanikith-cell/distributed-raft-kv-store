import {
  Crown,
  Database,
  HeartPulse,
  RefreshCw,
  Clock,
} from "lucide-react";

function ActivityItem({ type, message, time }) {

  const getIcon = () => {
    switch (type) {
      case "election":
        return <Crown size={13} className="text-amber-400" />;

      case "commit":
        return <Database size={13} className="text-purple-400" />;

      case "heartbeat":
        return <HeartPulse size={13} className="text-rose-400" />;

      case "sync":
        return <RefreshCw size={13} className="text-indigo-400 animate-spin-slow" />;

      default:
        return <Database size={13} className="text-slate-500" />;
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-900/60 last:border-b-0 hover:bg-white/[0.01] transition-all duration-300">

      {/* Event Details */}
      <div className="flex items-center gap-4">
        
        {/* Glowing Icon Wrapper */}
        <div className="w-8.5 h-8.5 rounded-xl bg-slate-950/60 border border-slate-900 flex items-center justify-center shadow-inner">
          {getIcon()}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <span className="text-[11px] font-extrabold capitalize text-slate-200 tracking-wider">
            {type}
          </span>
          <span className="text-slate-800 hidden sm:inline font-bold">
            •
          </span>
          <span className="text-xs text-slate-400 font-medium leading-relaxed">
            {message}
          </span>
        </div>

      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
        <Clock size={11} className="text-slate-700" />
        {time}
      </div>

    </div>
  );
}

export default ActivityItem;