import {
  LayoutDashboard,
  Database,
  TableProperties,
  ScrollText,
  Server,
  AlertTriangle,
} from "lucide-react";

function Sidebar() {
  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={15} />, active: true },
    { name: "Data Operations", icon: <Database size={15} />, active: false },
    { name: "Key-Value Store", icon: <TableProperties size={15} />, active: false },
    { name: "Logs", icon: <ScrollText size={15} />, active: false },
    { name: "Node Details", icon: <Server size={15} />, active: false },
    { name: "Failure Simulation", icon: <AlertTriangle size={15} />, active: false },
  ];

  return (
    <aside className="w-56 bg-slate-50 border-r border-slate-200/80 text-slate-500 min-h-[calc(100vh-56px)] p-4 flex flex-col justify-between select-none">
      <div className="flex flex-col gap-4">
        {/* Heading */}
        <div className="px-3 py-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">
            Console Menu
          </span>
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col gap-1 relative">
          {menuItems.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-xs font-semibold transition-all duration-200 relative group ${
                item.active
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-100/50 shadow-sm"
                  : "hover:bg-slate-100 hover:text-slate-800 text-slate-500 border border-transparent"
              }`}
            >
              {/* Left active line indicator */}
              {item.active && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-500 rounded-r-md" />
              )}
              <span className={`${item.active ? "text-indigo-500" : "text-slate-400 group-hover:text-slate-600"} transition-colors shrink-0`}>
                {item.icon}
              </span>
              <span>{item.name}</span>
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer Widget */}
      <div className="bg-white border border-slate-200/60 p-3.5 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col gap-2 mx-1">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold text-slate-600 font-mono uppercase tracking-wider">Raft Core</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;