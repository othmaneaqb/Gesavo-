import { StatusBadge } from "@/components/ui";
import { DocRow } from "@/features/documents";
import { I } from "@/shared/constants";
import { fmtDate } from "@/shared/utils";

export default function CaseDetail({ caseItem, clients, hearings, docs, tasks, canManageLegal, onBack, onEdit, onDelete }) {
  const client = clients.find(c => c.id === caseItem.clientId);
  const caseHearings = hearings.filter(h => h.caseId === caseItem.id);
  const caseDocs = docs.filter(d => d.caseId === caseItem.id);
  const caseTasks = tasks.filter(task => task.caseId === caseItem.id && !task.isArchived);
  const generatedAt = new Date();

  const exportPdf = () => {
    window.print();
  };

  return (
    <div>
      <div className="case-screen-actions flex justify-between items-center mb-4">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>{I.back} Back to Cases</button>
        <div className="flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={exportPdf}>{I.pdf} Export PDF</button>
          {canManageLegal && <button className="btn btn-ghost btn-sm" onClick={onEdit}>Edit Case</button>}
          {canManageLegal && <button className="btn btn-danger btn-sm" onClick={() => onDelete(caseItem.id)}>Delete Case</button>}
        </div>
      </div>

      <div className="case-print-cover">
        <div>
          <span>Cabinet Aït El Hadj Avocat</span>
          <h1>Rapport de dossier juridique</h1>
          <p>Document généré le {generatedAt.toLocaleDateString("fr-FR")} à {generatedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <div className="case-print-reference">
          <strong>{caseItem.caseNumber || "Sans référence"}</strong>
          <small>{caseItem.status}</small>
        </div>
      </div>

      <div className="detail-panel case-export-panel">
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
              <div className="info-item"><label>Client Email</label><span>{client?.email || "—"}</span></div>
              <div className="info-item"><label>Client Phone</label><span>{client?.phone || "—"}</span></div>
              <div className="info-item"><label>Court</label><span>{caseItem.court || "—"}</span></div>
              <div className="info-item"><label>Judge</label><span>{caseItem.judge}</span></div>
              <div className="info-item"><label>Type</label><span>{caseItem.type}</span></div>
              <div className="info-item"><label>Opened</label><span>{fmtDate(caseItem.openDate)}</span></div>
              <div className="info-item"><label>Next Hearing</label><span style={{ color: "var(--gold)" }}>{fmtDate(caseItem.nextHearing)}</span></div>
            </div>
          </div>
          {caseItem.description && (
            <div className="detail-section">
              <h4>Description</h4>
              <p className="case-export-description">{caseItem.description}</p>
            </div>
          )}
          <div className="detail-section">
            <h4>Tasks ({caseTasks.length})</h4>
            {caseTasks.map(task => (
              <div key={task.id} style={{ padding: "10px 0", borderBottom: "1px solid #F0EDE7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13.5 }}>{task.title}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{task.priority} · {fmtDate(task.deadline)}</div>
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))}
            {caseTasks.length === 0 && <div className="empty-state"><h3>No active tasks</h3></div>}
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
            {caseDocs.length === 0 && <div className="empty-state"><h3>No documents</h3></div>}
          </div>
          <div className="case-print-footer">
            <span>Cabinet Aït El Hadj Avocat</span>
            <span>Rigueur. Confidentialité. Excellence.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────
