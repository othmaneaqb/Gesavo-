export default function StatCard({ label, value, sub, isAmount }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={isAmount ? { fontSize: 24 } : {}}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}
