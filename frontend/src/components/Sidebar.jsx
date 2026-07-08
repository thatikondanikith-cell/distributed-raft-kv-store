import {
  LayoutDashboard,
  Database,
  TableProperties,
  ScrollText,
  Server,
  AlertTriangle,
} from "lucide-react";

function Sidebar({ clusterHealth = "Healthy" }) {
  const menuGroups = [
    {
      title: "Core Monitoring",
      items: [
        { name: "Dashboard", icon: <LayoutDashboard size={15} />, active: true },
        { name: "Node Details", icon: <Server size={15} />, active: false },
        { name: "Log Streams", icon: <ScrollText size={15} />, active: false },
      ]
    },
    {
      title: "Consensus Control",
      items: [
        { name: "Data Operations", icon: <Database size={15} />, active: false },
        { name: "Failure Simulation", icon: <AlertTriangle size={15} />, active: false },
      ]
    },
    {
      title: "Cluster Management",
      items: [
        { name: "Key-Value Store", icon: <TableProperties size={15} />, active: false },
      ]
    }
  ];

  const healthIndicators = {
    Healthy: { dot: "bg-emerald-500", text: "text-emerald-400", label: "Core Online" },
    Degraded: { dot: "bg-amber-500", text: "text-amber-400", label: "Quorum Degraded" },
    Unhealthy: { dot: "bg-rose-500", text: "text-rose-400", label: "Quorum Lost" },
  };
  const status = healthIndicators[clusterHealth] || healthIndicators.Healthy;

  return (
    <aside className="w-60 h-full bg-[#070912] border-r border-white/[0.02] p-5 flex flex-col justify-between select-none">
      
      {/* Menu Categories */}
      <div className="flex flex-col gap-6">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="flex flex-col gap-2">
            
            {/* Category Header */}
            <div className="px-3 py-1">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-600 font-sans">
                {group.title}
              </span>
            </div>

            {/* Group Items */}
            <nav className="flex flex-col gap-0.5">
              {group.items.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold transition-all duration-200 relative group ${
                    item.active
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 shadow-[0_0_20px_rgba(99,102,241,0.05)]"
                      : "hover:bg-white/[0.02] hover:text-slate-200 text-slate-400 border border-transparent"
                  }`}
                >
                  {/* Left indicator line */}
                  {item.active && (
                    <span className="absolute left-0 top-1/4 bottom-1/4 w-[2.5px] bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  )}
                  
                  <span className={`${item.active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-355"} transition-colors shrink-0`}>
                    {item.icon}
                  </span>
                  
                  <span className="tracking-wide">{item.name}</span>
                </div>
              ))}
            </nav>

          </div>
        ))}
      </div>

      {/* Footer monitor status widget */}
      <div className="bg-[#0c0d16] border border-white/[0.02] p-4 rounded-2xl flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.dot} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${status.dot}`}></span>
          </span>
          <span className={`text-[10px] font-bold ${status.text} uppercase tracking-wider font-mono`}>
            {status.label}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed font-sans">
          State replication console is live.
        </p>
      </div>

    </aside>
  );
}

export default Sidebar;