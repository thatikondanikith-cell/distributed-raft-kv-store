import { ArrowLeft, Crown, Server } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import NodeInfoCard from "../components/nodeDetails/NodeInfoCard";
import ReplicationStatusCard from "../components/nodeDetails/ReplicationStatusCard";
import LogEntriesTable from "../components/nodeDetails/LogEntriesTable";
import MetricsCard from "../components/nodeDetails/MetricsCard";
import { getNodeDetails } from "../data/nodesData";

function NodeDetails() {
  const { id } = useParams();
  const node = getNodeDetails(id);

  if (!node) return <div className="glass-card rounded-2xl max-w-lg p-8 text-center mx-auto mt-12"><Server className="mx-auto text-slate-500 mb-3" /><h1 className="text-lg font-bold text-slate-200">Node Not Found</h1><p className="mt-2 text-xs text-slate-500">No cluster node matches ID {id}.</p><Link to="/nodes" className="inline-flex items-center gap-1.5 mt-5 px-3 py-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-xs font-bold text-indigo-400 hover:bg-indigo-500/15"><ArrowLeft size={13} /> Back to Nodes</Link></div>;

  const roleClass = node.role === "Leader" ? "bg-amber-500/10 text-amber-400 border-amber-500/25" : node.role === "Candidate" ? "bg-purple-500/10 text-purple-400 border-purple-500/25" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/25";
  const statusClass = node.status === "Running" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" : "bg-rose-500/10 text-rose-400 border-rose-500/25";

  return <div className="w-full max-w-6xl mx-auto flex flex-col gap-7"><div className="pb-6 border-b border-white/[0.03]"><Link to="/nodes" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-400 transition-colors mb-4"><ArrowLeft size={13} /> All Nodes</Link><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><div className="flex items-center gap-3"><span className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 grid place-items-center border border-indigo-500/15"><Server size={18} /></span><div><h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">{node.name}</h1><p className="mt-1 text-xs text-slate-500 font-mono">{node.address}</p></div></div></div><div className="flex flex-wrap gap-2"><span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full border ${roleClass}`}>{node.role === "Leader" && <Crown size={10} />}{node.role}</span><span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full border ${statusClass}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{node.status}</span></div></div></div><div className="grid grid-cols-1 xl:grid-cols-2 gap-6"><NodeInfoCard node={node} /><ReplicationStatusCard replicationStatus={node.replicationStatus} /></div><section><div className="flex items-center gap-3 mb-5"><span className="w-1 h-5 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.8)]" /><h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider">Replicated Log</h2></div><LogEntriesTable logs={node.logs} /></section><section><div className="flex items-center gap-3 mb-5"><span className="w-1 h-5 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.8)]" /><h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider">Node Metrics</h2></div><MetricsCard metrics={node.metrics} /></section></div>;
}
export default NodeDetails;
