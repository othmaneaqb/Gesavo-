import { useI18n } from "@/i18n";

export default function StatusBadge({ status, variant, children, className = "" }) {
  const { t } = useI18n();
  const map = { active: "badge-active", pending: "badge-pending", closed: "badge-closed", urgent: "badge-urgent", civil: "badge-civil", criminal: "badge-criminal", commercial: "badge-commercial", "in-progress": "badge-pending", todo: "badge-gold", done: "badge-active", upcoming: "badge-gold", completed: "badge-active" };
  const variantClass = variant ? `badge-${variant}` : map[status] || "badge-neutral";
  const label = children ?? t(`status.${status}`, status);

  return <span className={`badge ${variantClass} ${className}`.trim()}>{label}</span>;
}
