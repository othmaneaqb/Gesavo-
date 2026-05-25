import { StatCard, StatusBadge } from "@/components/ui";
import { fmtCurrency, fmtDate, priorityColor } from "@/shared/utils";
import { useI18n } from "@/i18n";

export default function Dashboard({ clients, cases, tasks, hearings, expenses, activities, canViewFinance }) {
  const { language, t } = useI18n();
  const totalOwed = clients.reduce((sum, client) => sum + (client.totalFees - client.paidFees), 0);
  const activeCases = cases.filter(item => item.status === "active" || item.status === "urgent").length;
  const pendingTasks = tasks.filter(task => task.status !== "done").length;
  const upcomingHearings = hearings.filter(hearing => hearing.status === "upcoming").length;

  return (
    <div>
      <div className="stats-grid">
        <StatCard label={t("ui.activeClients")} value={clients.filter(client => client.status === "active").length} sub={t("ui.currentActiveClients")} />
        <StatCard label={t("ui.openCases")} value={activeCases} sub={`${cases.filter(item => item.status === "urgent").length} ${t("ui.urgent")}`} />
        <StatCard label={t("ui.pendingTasks")} value={pendingTasks} sub={t("ui.acrossAllCases")} />
        {canViewFinance && <StatCard label={t("ui.outstandingFees")} value={fmtCurrency(totalOwed)} sub={t("ui.totalReceivable")} isAmount />}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t("ui.upcomingHearings")}</h3>
            <span className="text-muted">{upcomingHearings} {t("ui.scheduled")}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {hearings.filter(item => item.status === "upcoming").slice(0, 4).map(hearing => (
              <div key={hearing.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--paper)", borderRadius: 8 }}>
                <div style={{ background: "var(--gold-pale)", border: "1px solid var(--gold)", borderRadius: 8, padding: "6px 10px", textAlign: "center", minWidth: 46 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "var(--gold)", fontFamily: "var(--font-heading)" }}>{new Date(hearing.date).getDate()}</div>
                  <div style={{ fontSize: 9, textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.1em" }}>{new Date(hearing.date).toLocaleString(language, { month: "short" })}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{hearing.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{hearing.court} · {hearing.time}</div>
                </div>
                <StatusBadge status="upcoming" />
              </div>
            ))}
            {upcomingHearings === 0 && <div className="empty-state"><h3>{t("ui.noUpcomingHearings")}</h3></div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t("ui.recentActivity")}</h3>
          </div>
          <ul className="activity-list">
            {activities.map(activity => (
              <li key={activity.id} className="activity-item">
                <div className="activity-dot" />
                <div>
                  <div className="activity-text">{activity.text}</div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              </li>
            ))}
          </ul>
          {activities.length === 0 && <div className="empty-state"><h3>{t("ui.noRecentActivity")}</h3></div>}
        </div>
      </div>

      <div className={canViewFinance ? "grid-2" : ""}>
        {canViewFinance && <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t("ui.outstandingBalances")}</h3>
          </div>
          {clients.filter(client => client.totalFees > client.paidFees).map(client => {
            const pct = Math.round((client.paidFees / client.totalFees) * 100);
            return (
              <div key={client.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{client.name}</span>
                  <span style={{ fontSize: 12, color: "var(--danger)" }}>{fmtCurrency(client.totalFees - client.paidFees)} {t("ui.due")}</span>
                </div>
                <div className="balance-bar"><div className="balance-fill" style={{ width: `${pct}%` }} /></div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{pct}% {t("ui.paid")} · {fmtCurrency(client.paidFees)} / {fmtCurrency(client.totalFees)}</div>
              </div>
            );
          })}
          {clients.every(client => client.totalFees <= client.paidFees) && <div className="empty-state"><h3>{t("ui.noOutstandingBalances")}</h3></div>}
        </div>}

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t("ui.openTasks")}</h3>
          </div>
          {tasks.filter(task => task.status !== "done").slice(0, 5).map(task => (
            <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #F0EDE7" }}>
              <span style={{ fontSize: 10, color: priorityColor(task.priority), textTransform: "uppercase", letterSpacing: "0.1em", minWidth: 50 }}>{task.priority}</span>
              <span style={{ flex: 1, fontSize: 13.5 }}>{task.title}</span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{fmtDate(task.deadline)}</span>
            </div>
          ))}
          {tasks.every(task => task.status === "done") && <div className="empty-state"><h3>{t("ui.noOpenTasks")}</h3></div>}
        </div>
      </div>
    </div>
  );
}
