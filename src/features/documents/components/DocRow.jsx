import { I } from "@/shared/constants";
import { fmtDate } from "@/shared/utils";

export default function DocRow({ doc }) {
  const icons = { pdf: "📄", docx: "📝", jpg: "🖼", png: "🖼" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F0EDE7" }}>
      <span style={{ fontSize: 20 }}>{icons[doc.type] || "📎"}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 13.5 }}>{doc.name}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{doc.desc} · {doc.size} · {fmtDate(doc.date)}</div>
      </div>
      <button className="btn btn-ghost btn-sm">{I.download} Download</button>
    </div>
  );
}
