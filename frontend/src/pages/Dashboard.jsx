import NodeCard from "../components/NodeCard";
import OverviewCard from "../components/OverviewCard";
import { nodes, overview,recentActivity  } from "../data/dashboardData";
import ActivityItem from "../components/ActivityItem";


import {
  CircleCheckBig,
  Crown,
  Server,
  Database,
  Hash,
} from "lucide-react";

function Dashboard() {
  const getIcon = (icon) => {
    switch (icon) {
      case "status":   return <CircleCheckBig size={15} />;
      case "leader":   return <Crown size={15} />;
      case "nodes":    return <Server size={15} />;
      case "commit":   return <Database size={15} />;
      case "term":     return <Hash size={15} />;
      default:         return null;
    }
  };

  const themeMap = {
    status: {
      borderColor: "border-t-emerald-400",
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-600",
      valueColor: "text-emerald-700",
    },
    leader: {
      borderColor: "border-t-amber-400",
      iconBg: "bg-amber-50",
      iconText: "text-amber-600",
      valueColor: "text-amber-700",
    },
    nodes: {
      borderColor: "border-t-blue-400",
      iconBg: "bg-blue-50",
      iconText: "text-blue-600",
      valueColor: "text-blue-700",
    },
    commit: {
      borderColor: "border-t-violet-400",
      iconBg: "bg-violet-50",
      iconText: "text-violet-600",
      valueColor: "text-violet-700",
    },
    term: {
      borderColor: "border-t-rose-400",
      iconBg: "bg-rose-50",
      iconText: "text-rose-600",
      valueColor: "text-rose-700",
    },
  };

  const SectionLabel = ({ children }) => (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-0.5 h-4 bg-indigo-500 rounded-full" />
      <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {children}
      </h2>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Cluster Dashboard
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Real-time monitoring for the distributed Raft key-value cluster.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-700 font-bold self-start sm:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          LIVE TELEMETRY
        </div>
      </div>

      {/* Cluster Health Metrics */}
      <section>
        <SectionLabel>Cluster Health Metrics</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {overview.map((item) => (
            <OverviewCard
              key={item.id}
              title={item.title}
              value={item.value}
              icon={getIcon(item.icon)}
              theme={themeMap[item.icon]}
            />
          ))}
        </div>
      </section>

      {/* Node Status */}
      <section>
        <SectionLabel>Node Status </SectionLabel>
        <div className="flex flex-wrap gap-5">
          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              nodeName={node.nodeName}
              role={node.role}
              status={node.status}
              term={node.term}
              logIndex={node.logIndex}
            />
          ))}
        </div>
      </section>

      {/* Recent Activity */}
        <section>
          <SectionLabel>Recent Activity</SectionLabel>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

            {recentActivity.slice(0,7).map((activity) => (
              <ActivityItem
                key={activity.id}
                type={activity.type}
                message={activity.message}
                time={activity.time}
              />
            ))}

          </div>
        </section>

     

    </div>
  );
}

export default Dashboard;