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
        return <Crown size={14} className="text-amber-500" />;

      case "commit":
        return <Database size={14} className="text-violet-500" />;

      case "heartbeat":
        return <HeartPulse size={14} className="text-red-500" />;

      case "sync":
        return <RefreshCw size={14} className="text-blue-500" />;

      default:
        return <Database size={14} className="text-slate-400" />;
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition">

      {/* Left */}

      <div className="flex items-center gap-3">

        <div className="w-7 h-7 rounded-md bg-slate-50 flex items-center justify-center">
          {getIcon()}
        </div>

        <div className="flex items-center gap-2">

          <span className="text-xs font-semibold capitalize text-slate-700">
            {type}
          </span>

          <span className="text-xs text-slate-400">
            •
          </span>

          <span className="text-xs text-slate-500">
            {message}
          </span>

        </div>

      </div>

      {/* Right */}

      <div className="flex items-center gap-1 text-[11px] text-slate-400">

        <Clock size={12} />

        {time}

      </div>

    </div>
  );
}

export default ActivityItem;