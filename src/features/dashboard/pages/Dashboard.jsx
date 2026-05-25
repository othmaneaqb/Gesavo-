import { StatCard, StatusBadge } from "@/components/ui";
import { fmtCurrency, fmtDate, priorityColor } from "@/shared/utils";

export default function Dashboard({ clients, cases, tasks, hearings, expenses, activities, canViewFinance }) {
  const totalOwed = clients.reduce((s, c) => s + (c.totalFees - c.paidFees), 0);
  const activeCases = cases.filter(c => c.status === "active" || c.status === "urgent").length;
  const pendingTasks = tasks.filter(t => t.status !== "done").length;
  const upcomingHearings = hearings.filter(h => h.status === "upcoming").length;

  return (
    <div>
      <div className="stats-grid">
        <StatCard label="Active Clients" value={clients.filter(c => c.status === "active").length} sub="Current active clients" />
        <StatCard label="Open Cases" value={activeCases} sub={`${cases.filter(c => c.status === "urgent").length} urgent`} />
        <StatCard label="Pending Tasks" value={pendingTasks} sub="across all cases" />
        {canViewFinance && <StatCard label="Outstanding Fees" value={fmtCurrency(totalOwed)} sub="Total receivable" isAmount />}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Upcoming Hearings */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upcoming Hearings</h3>
            <span className="text-muted">{upcomingHearings} scheduled</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {hearings.filter(h => h.status === "upcoming").slice(0, 4).map(h => (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--paper)", borderRadius: 8 }}>
                <div style={{ background: "var(--gold-pale)", border: "1px solid var(--gold)", borderRadius: 8, padding: "6px 10px", textAlign: "center", minWidth: 46 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "var(--gold)", fontFamily: "Cormorant Garamond, serif" }}>{new Date(h.date).getDate()}</div>
                  <div style={{ fontSize: 9, textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.1em" }}>{new Date(h.date).toLocaleString("en", { month: "short" })}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{h.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{h.court} · {h.time}</div>
                </div>
                <StatusBadge status="upcoming" />
              </div>
            ))}
            {upcomingHearings === 0 && <div className="empty-state"><h3>No upcoming hearings</h3></div>}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          <ul className="activity-list">
            {activities.map(a => (
              <li key={a.id} className="activity-item">
                <div className="activity-dot" />
                <div>
                  <div className="activity-text">{a.text}</div>
                  <div className="activity-time">{a.time}</div>
                </div>
              </li>
            ))}
          </ul>
          {activities.length === 0 && <div className="empty-state"><h3>No recent activity</h3></div>}
        </div>
      </div>

      <div className={canViewFinance ? "grid-2" : ""}>
        {/* Outstanding Balances */}
        {canViewFinance && <div className="card">
          <div className="card-header">
            <h3 className="card-title">Outstanding Balances</h3>
          </div>
          {clients.filter(c => c.totalFees > c.paidFees).map(c => {
            const pct = Math.round((c.paidFees / c.totalFees) * 100);
            return (
              <div key={c.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: "var(--danger)" }}>{fmtCurrency(c.totalFees - c.paidFees)} due</span>
                </div>
                <div className="balance-bar"><div className="balance-fill" style={{ width: `${pct}%` }} /></div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{pct}% paid · {fmtCurrency(c.paidFees)} of {fmtCurrency(c.totalFees)}</div>
              </div>
            );
          })}
          {clients.every(c => c.totalFees <= c.paidFees) && <div className="empty-state"><h3>No outstanding balances</h3></div>}
        </div>}

        {/* Open Tasks Summary */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Open Tasks</h3>
          </div>
          {tasks.filter(t => t.status !== "done").slice(0, 5).map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #F0EDE7" }}>
              <span style={{ fontSize: 10, color: priorityColor(t.priority), textTransform: "uppercase", letterSpacing: "0.1em", minWidth: 50 }}>{t.priority}</span>
              <span style={{ flex: 1, fontSize: 13.5 }}>{t.title}</span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{fmtDate(t.deadline)}</span>
            </div>
          ))}
          {tasks.every(t => t.status === "done") && <div className="empty-state"><h3>No open tasks</h3></div>}
        </div>
      </div>
    </div>
  );
}

// CLIENTS ──────────────────────────────────────────────────────────────────
