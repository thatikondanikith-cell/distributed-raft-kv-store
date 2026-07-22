import { Activity, Clock3, Database, GitCommitHorizontal, ListTree, ShieldCheck, Timer, Trophy, UsersRound } from "lucide-react";

const roleStyles = { Leader: "text-amber-400", Candidate: "text-purple-400", Follower: "text-indigo-400" };

function NodeInfoCard({ node }) {
  const baseDetails = [
    [Activity, "Status", node.status],
    [Trophy, "Role", node.role],
    [GitCommitHorizontal, "Current Term", node.term],
  ];
  const leaderDetails = [
    [Database, "Commit Index", node.commitIndex],
    [GitCommitHorizontal, "Last Applied Index", node.lastAppliedIndex],
    [ListTree, "Total Log Entries", node.totalLogEntries],
    [Clock3, "Last Heartbeat", node.lastHeartbeat],
    [Timer, "Uptime", node.uptime],
  ];
  const followerDetails = [
    [UsersRound, "Current Leader", node.currentLeader],
    [Database, "Commit Index", node.commitIndex],
    [GitCommitHorizontal, "Last Applied Index", node.lastAppliedIndex],
    [ListTree, "Total Log Entries", node.totalLogEntries],
    [Clock3, "Last Heartbeat", node.lastHeartbeat],
    [Timer, "Uptime", node.uptime],
  ];
  const candidateDetails = [
    [UsersRound, "Votes Received", node.votesReceived],
    [Database, "Commit Index", node.commitIndex],
    [GitCommitHorizontal, "Last Applied Index", node.lastAppliedIndex],
    [ListTree, "Total Log Entries", node.totalLogEntries],
    [Timer, "Uptime", node.uptime],
  ];
  const details = [...baseDetails, ...(node.role === "Leader" ? leaderDetails : node.role === "Candidate" ? candidateDetails : followerDetails)];
  return <div className="glass-card rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
    <div className="px-5 py-4 border-b border-slate-900 flex items-center gap-2"><ShieldCheck size={14} className="text-indigo-400" /><h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Node Information</h2></div>
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-0 p-3">
      {details.map(([Icon, label, value]) => <div key={label} className="flex items-center gap-3 px-2 py-3 border-b border-slate-900/60 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
        <span className="w-7 h-7 rounded-lg bg-slate-950 border border-white/[0.04] grid place-items-center text-slate-500"><Icon size={13} /></span>
        <div className="min-w-0"><dt className="text-[9px] uppercase tracking-wider font-bold text-slate-500">{label}</dt><dd className={`mt-0.5 text-xs font-bold ${label === "Role" ? roleStyles[node.role] : label === "Status" && node.status === "Offline" ? "text-rose-400" : "text-slate-300"}`}>{value}</dd></div>
      </div>)}
    </dl>
  </div>;
}

export default NodeInfoCard;
