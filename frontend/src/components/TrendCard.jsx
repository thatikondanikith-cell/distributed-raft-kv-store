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
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-500 border border-indigo-100">
          Live
        </span>
      </div>

      {/* SVG Chart */}
      <div className="flex-1 flex items-center min-h-[80px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>

          <polygon points={areaPoints} fill="url(#area-grad)" />

          <polyline
            points={points}
            fill="none"
            stroke="url(#line-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Footer Stats */}
      <div className="flex justify-between items-end mt-4 pt-3 border-t border-slate-100">
        <div>
          <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Start</span>
          <span className="text-xs font-bold text-slate-500 font-mono">{data[0]}</span>
        </div>
        <div className="text-right">
          <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Latest</span>
          <span className="text-base font-extrabold text-indigo-600 font-mono">{data[data.length - 1]}</span>
        </div>
      </div>
    </div>
  );
}

export default TrendCard;