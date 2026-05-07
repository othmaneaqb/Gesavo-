export default function StatusBadge({ status }) {
  const map = { active: "badge-active", pending: "badge-pending", closed: "badge-closed", urgent: "badge-urgent", civil: "badge-civil", criminal: "badge-criminal", commercial: "badge-commercial", "in-progress": "badge-pending", todo: "badge-gold", done: "badge-active", upcoming: "badge-gold", completed: "badge-active" };
  return <span className={`badge ${map[status] || "badge-closed"}`}>{status}</span>;
}
