function OverviewCard({ title, value, icon, theme }) {
  const { borderColor, iconBg, iconText, valueColor } = theme || {
    borderColor: "border-t-slate-300",
    iconBg: "bg-slate-100",
    iconText: "text-slate-500",
    valueColor: "text-slate-800",
  };

  return (
    <div
      className={`bg-white border border-slate-200 border-t-2 ${borderColor} rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col gap-3`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
        <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${iconBg} ${iconText}`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-extrabold tracking-tight ${valueColor}`}>{value}</p>
    </div>
  );
}

export default OverviewCard;