import { StatusBadge } from "@/components/ui";
import { DocRow } from "@/features/documents";
import { I } from "@/shared/constants";
import { fmtDate } from "@/shared/utils";

export default function CaseDetail({ caseItem, clients, hearings, docs, onBack }) {
  const client = clients.find(c => c.id === caseItem.clientId);
  const caseHearings = hearings.filter(h => h.caseId === caseItem.id);
  const caseDocs = docs.filter(d => d.caseId === caseItem.id);

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-4" onClick={onBack}>{I.back} Back to Cases</button>
      <div className="detail-panel">
        <div className="detail-header">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 30 }}>{I.cases}</div>
            <div>
              <h2>{caseItem.title}</h2>
              <div className="detail-meta">{caseItem.caseNumber} · {caseItem.court}</div>
              <div className="detail-meta" style={{ marginTop: 4, display: "flex", gap: 8 }}>
                <StatusBadge status={caseItem.status} />
                <span className={`badge badge-${caseItem.type}`}>{caseItem.type}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="detail-body">
          <div className="detail-section">
            <h4>Case Information</h4>
            <div className="info-grid">
              <div className="info-item"><label>Client</label><span>{client?.name}</span></div>
              <div className="info-item"><label>Judge</label><span>{caseItem.judge}</span></div>
              <div className="info-item"><label>Opened</label><span>{fmtDate(caseItem.openDate)}</span></div>
              <div className="info-item"><label>Next Hearing</label><span style={{ color: "var(--gold)" }}>{fmtDate(caseItem.nextHearing)}</span></div>
            </div>
          </div>
          <div className="detail-section">
            <h4>Hearings ({caseHearings.length})</h4>
            {caseHearings.map(h => (
              <div key={h.id} style={{ padding: "10px 0", borderBottom: "1px solid #F0EDE7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13.5 }}>{h.title}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{fmtDate(h.date)} · {h.time}</div>
                  {h.outcome && <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 4, fontStyle: "italic" }}>{h.outcome}</div>}
                </div>
                <StatusBadge status={h.status} />
              </div>
            ))}
          </div>
          <div className="detail-section">
            <h4>Documents ({caseDocs.length})</h4>
            {caseDocs.map(d => <DocRow key={d.id} doc={d} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────
