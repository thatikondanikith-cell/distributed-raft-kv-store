function TrendCard({ title = "Log Growth", data = [] }) {
  const width = 240;
  const height = 120;

  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - 8 - ((val - min) / range) * (height - 16);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `${points} ${width},${height} 0,${height}`;

  return (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col justify-between hover:border-slate-800 transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</span>
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider font-mono">
          LIVE
        </span>
      </div>

      {/* SVG Chart */}
      <div className="w-full h-[90px] py-2 flex items-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <polygon points={areaPoints} fill="rgba(99, 102, 241, 0.08)" />

          <polyline
            points={points}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Footer Stats */}
      <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-900">
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wide font-sans">Start</span>
          <span className="text-xs font-bold text-slate-400 font-mono">{data[0]}</span>
        </div>
        <div className="text-right">
          <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wide font-sans">Latest</span>
          <span className="text-lg font-extrabold text-indigo-400 font-mono">{data[data.length - 1]}</span>
        </div>
      </div>

    </div>
  );
}

export default TrendCard;