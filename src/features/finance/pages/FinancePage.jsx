import { useState } from "react";
import { StatCard, StatusBadge } from "@/components/ui";
import { fmtCurrency, fmtDate } from "@/shared/utils";

export default function FinancePage({ clients, expenses, cases }) {
  const [tab, setTab] = useState("overview");
  const totalInvoiced = clients.reduce((s, c) => s + c.totalFees, 0);
  const totalPaid = clients.reduce((s, c) => s + c.paidFees, 0);
  const totalOwed = totalInvoiced - totalPaid;

  return (
    <div>
      <div className="stats-grid mb-6">
        <StatCard label="Total Invoiced" value={fmtCurrency(totalInvoiced)} sub="All clients" isAmount />
        <StatCard label="Total Received" value={fmtCurrency(totalPaid)} sub="Payments collected" isAmount />
        <StatCard label="Outstanding" value={fmtCurrency(totalOwed)} sub="Pending collection" isAmount />
        <StatCard label="Collection Rate" value={`${Math.round((totalPaid / totalInvoiced) * 100)}%`} sub="Of total fees" />
      </div>
      <div className="card">
        <div className="tabs">
          {["overview", "transactions", "balances"].map(t => <div key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</div>)}
        </div>
        {tab === "overview" && (
          <div>
            <h4 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 16, marginBottom: 14 }}>Outstanding Balances by Client</h4>
            {clients.filter(c => c.totalFees > c.paidFees).map(c => {
              const pct = Math.round((c.paidFees / c.totalFees) * 100);
              return (
                <div key={c.id} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                    <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                      <span style={{ color: "var(--success)" }}>Paid: {fmtCurrency(c.paidFees)}</span>
                      <span style={{ color: "var(--danger)" }}>Due: {fmtCurrency(c.totalFees - c.paidFees)}</span>
                    </div>
                  </div>
                  <div className="balance-bar"><div className="balance-fill" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        )}
        {tab === "transactions" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Description</th><th>Client</th><th>Type</th><th>Amount</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {expenses.map(e => {
                  const client = clients.find(c => c.id === e.clientId);
                  return (
                    <tr key={e.id}>
                      <td className="bold">{e.description}</td>
                      <td>{client?.name}</td>
                      <td><span className="badge badge-gold">{e.type}</span></td>
                      <td style={{ color: e.type === "payment" ? "var(--success)" : "var(--slate)", fontWeight: 600 }}>{fmtCurrency(e.amount)}</td>
                      <td style={{ fontSize: 12, color: "var(--muted)" }}>{fmtDate(e.date)}</td>
                      <td>{e.status ? <StatusBadge status={e.status} /> : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {tab === "balances" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Client</th><th>Total Billed</th><th>Paid</th><th>Outstanding</th><th>Status</th></tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id}>
                    <td className="bold">{c.name}</td>
                    <td>{fmtCurrency(c.totalFees)}</td>
                    <td style={{ color: "var(--success)" }}>{fmtCurrency(c.paidFees)}</td>
                    <td style={{ color: c.totalFees > c.paidFees ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>
                      {c.totalFees > c.paidFees ? fmtCurrency(c.totalFees - c.paidFees) : "—"}
                    </td>
                    <td>{c.totalFees > c.paidFees ? <StatusBadge status="pending" /> : <StatusBadge status="active" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TASKS ────────────────────────────────────────────────────────────────────
