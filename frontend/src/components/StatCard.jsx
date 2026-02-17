export default function StatCard({ icon: Icon, label, value, sub, color = "text-teal-400" }) {
  return (
    <div className="bg-navy-900 border border-navy-800 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-navy-800 ${color}`}>
          <Icon size={20} />
        </div>
        <span className="text-navy-400 text-sm font-medium">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-navy-400 text-sm mt-1">{sub}</p>}
    </div>
  );
}
