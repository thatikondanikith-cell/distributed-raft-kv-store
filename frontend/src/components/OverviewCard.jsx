function OverviewCard({ title, value, icon, theme }) {
  const { borderColor, iconBg, iconText, valueColor } = theme || {
    borderColor: "border-t-slate-800",
    iconBg: "bg-slate-800/40",
    iconText: "text-slate-400",
    valueColor: "text-slate-200",
  };

  return (
    <div
      className={`glass-card border-t-2 ${borderColor} rounded-2xl p-6 flex flex-col justify-between min-h-[7.5rem] group hover:border-slate-800/80 transition-all duration-300`}
    >
      
      {/* Title + Icon */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 tracking-wide uppercase font-sans">
          {title}
        </span>
        <div className={`flex items-center justify-center w-8 h-8 rounded-xl ${iconBg} ${iconText} border border-white/5 shadow-inner`}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <div className="mt-3">
        <p className={`text-2xl font-extrabold tracking-tight ${valueColor}`}>
          {value}
        </p>
      </div>

    </div>
  );
}

export default OverviewCard;