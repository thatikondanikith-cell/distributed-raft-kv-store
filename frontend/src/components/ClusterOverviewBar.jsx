function ClusterOverviewBar({ items }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg divide-x divide-gray-100 shadow-sm flex">
      {items.map((item) => (
        <div key={item.id} className="flex-1 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="text-sm">{item.icon}</div>
            <span className="text-xs text-gray-500">{item.title}</span>
          </div>
          <p className="text-base font-bold text-gray-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export default ClusterOverviewBar;