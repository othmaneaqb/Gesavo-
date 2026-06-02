import { useState } from "react";
import { StatusBadge } from "@/components/ui";
import { DocRow } from "@/features/documents";
import { I } from "@/shared/constants";
import { fmtCurrency, fmtDate } from "@/shared/utils";

export default function ClientDetail({ client, cases, docs, activities, expenses, canViewFinance, onBack, onEdit, onDelete, onEditDocument, onDeleteDocument }) {
  const [tab, setTab] = useState("overview");
  const clientCases = cases.filter(c => c.clientId === client.id);
  const clientDocs = docs.filter(d => d.clientId === client.id);
  const clientActs = activities.filter(a => a.clientId === client.id);
  const clientExp = expenses.filter(e => e.clientId === client.id);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>{I.back} Back to Clients</button>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>Edit Client</button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(client.id)}>Delete Client</button>
        </div>
      </div>
      <div className="detail-panel">
        <div className="detail-header">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="avatar" style={{ width: 48, height: 48, fontSize: 18 }}>{client.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
            <div>
              <h2>{client.name}</h2>
              <div className="detail-meta">{client.nationalId} · {client.phone} · {client.email}</div>
              <div className="detail-meta" style={{ marginTop: 4 }}><StatusBadge status={client.status} /></div>
            </div>
          </div>
        </div>
        <div className="detail-body">
          <div className="tabs" style={{ padding: "0 24px" }}>
            {["overview", "cases", "documents", "activity", ...(canViewFinance ? ["finance"] : [])].map(t => (
              <div key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</div>
            ))}
          </div>
          <div style={{ padding: "0 24px 24px" }}>
            {tab === "overview" && (
              <div>
                <div className="info-grid mb-4">
                  <div className="info-item"><label>Address</label><span>{client.address}</span></div>
                  <div className="info-item"><label>Last Activity</label><span>{fmtDate(client.lastActivity)}</span></div>
                  {canViewFinance && <div className="info-item"><label>Total Fees</label><span>{fmtCurrency(client.totalFees)}</span></div>}
                  {canViewFinance && <div className="info-item"><label>Balance Due</label><span style={{ color: client.totalFees > client.paidFees ? "var(--danger)" : "var(--success)" }}>{client.totalFees > client.paidFees ? fmtCurrency(client.totalFees - client.paidFees) : "Fully Paid ✓"}</span></div>}
                </div>
                {client.notes && <div style={{ background: "var(--gold-pale)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "var(--slate)" }}><strong>Note:</strong> {client.notes}</div>}
              </div>
            )}
            {tab === "cases" && (
              <div>
                {clientCases.length === 0 ? <div className="empty-state"><h3>No cases</h3></div> : clientCases.map(c => (
                  <div key={c.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{c.title}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{c.caseNumber} · {c.court}</div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            )}
            {tab === "documents" && (
              <div>
                {clientDocs.map(d => (
                  <DocRow key={d.id} doc={d} onEdit={onEditDocument} onDelete={onDeleteDocument} />
                ))}
                {clientDocs.length === 0 && <div className="empty-state"><h3>No documents</h3></div>}
              </div>
            )}
            {tab === "activity" && (
              <ul className="activity-list">{clientActs.map(a => (
                <li key={a.id} className="activity-item">
                  <div className="activity-dot" />
                  <div><div className="activity-text">{a.text}</div><div className="activity-time">{a.time}</div></div>
                </li>
              ))}</ul>
            )}
            {tab === "finance" && (
              <div>
                {clientExp.map(e => (
                  <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{e.description}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{fmtDate(e.date)} · {e.type}</div>
                    </div>
                    <div style={{ fontWeight: 600, color: e.type === "payment" ? "var(--success)" : "var(--danger)" }}>
                      {e.type === "payment" ? "+" : "-"}{fmtCurrency(e.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CASES ────────────────────────────────────────────────────────────────────
