import { Link } from "react-router-dom";
import { StatCard, StatusBadge } from "@/components/ui";
import { fmtCurrency, fmtDate, priorityColor } from "@/shared/utils";
import { useI18n } from "@/i18n";
import "../dashboard.css";

export default function Dashboard({ clients, cases, tasks, hearings, expenses, activities, canViewFinance }) {
  const { language, t } = useI18n();
  const totalOwed = clients.reduce((sum, client) => sum + (client.totalFees - client.paidFees), 0);
  const activeCases = cases.filter(item => item.status === "active" || item.status === "urgent").length;
  const pendingTasks = tasks.filter(task => task.status !== "done").length;
  const upcomingHearings = hearings.filter(hearing => hearing.status === "upcoming").length;

  return (
    <div className={`dashboard-page ${canViewFinance ? "" : "dashboard-page-without-finance"}`}>
      <div className="stats-grid">
        <StatCard label={t("ui.activeClients")} value={clients.filter(client => client.status === "active").length} sub={t("ui.currentActiveClients")} />
        <StatCard label={t("ui.openCases")} value={activeCases} sub={`${cases.filter(item => item.status === "urgent").length} ${t("ui.urgent")}`} />
        <StatCard label={t("ui.pendingTasks")} value={pendingTasks} sub={t("ui.acrossAllCases")} />
        {canViewFinance && <StatCard label={t("ui.outstandingFees")} value={fmtCurrency(totalOwed)} sub={t("ui.totalReceivable")} isAmount />}
      </div>

      <div className={`dashboard-panel-grid ${canViewFinance ? "" : "dashboard-panel-grid-without-finance"}`}>
        <div className="card dashboard-section-card dashboard-upcoming">
          <div className="card-header">
            <h3 className="card-title">{t("ui.upcomingHearings")}</h3>
            <span className="text-muted">{upcomingHearings} {t("ui.scheduled")}</span>
          </div>
          <div className="dashboard-hearing-list">
            {hearings.filter(item => item.status === "upcoming").slice(0, 4).map(hearing => (
              <div key={hearing.id} className="dashboard-hearing-row">
                <div className="dashboard-hearing-date">
                  <div className="dashboard-hearing-day">{new Date(hearing.date).getDate()}</div>
                  <div className="dashboard-hearing-month">{new Date(hearing.date).toLocaleString(language, { month: "short" })}</div>
                </div>
                <div className="dashboard-hearing-copy">
                  <div className="dashboard-hearing-title">{hearing.title}</div>
                  <div className="dashboard-hearing-meta">{hearing.court} · {hearing.time}</div>
                </div>
                <StatusBadge status="upcoming" />
              </div>
            ))}
            {upcomingHearings === 0 && <div className="empty-state"><h3>{t("ui.noUpcomingHearings")}</h3></div>}
          </div>
          <Link className="dashboard-card-link" to="/calendar">{t("nav.calendar")}</Link>
        </div>

        <div className="card dashboard-section-card dashboard-activity">
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

        {canViewFinance && <div className="card dashboard-section-card dashboard-balances">
          <div className="card-header">
            <h3 className="card-title">{t("ui.outstandingBalances")}</h3>
          </div>
          {clients.filter(client => client.totalFees > client.paidFees).map(client => {
            const pct = Math.round((client.paidFees / client.totalFees) * 100);
            return (
              <div key={client.id} className="dashboard-balance-item">
                <div className="dashboard-balance-heading">
                  <span className="dashboard-balance-client">{client.name}</span>
                  <span className="dashboard-balance-due">{fmtCurrency(client.totalFees - client.paidFees)} {t("ui.due")}</span>
                </div>
                <div className="balance-bar"><div className="balance-fill" style={{ width: `${pct}%` }} /></div>
                <div className="dashboard-balance-meta">{pct}% {t("ui.paid")} · {fmtCurrency(client.paidFees)} / {fmtCurrency(client.totalFees)}</div>
              </div>
            );
          })}
          {clients.every(client => client.totalFees <= client.paidFees) && <div className="empty-state"><h3>{t("ui.noOutstandingBalances")}</h3></div>}
          <Link className="dashboard-card-link" to="/finance">{t("nav.finance")}</Link>
        </div>}

        <div className="card dashboard-section-card dashboard-open-tasks">
          <div className="card-header">
            <h3 className="card-title">{t("ui.openTasks")}</h3>
          </div>
          {tasks.filter(task => task.status !== "done").slice(0, 5).map(task => (
            <div key={task.id} className="dashboard-task-row">
              <span className="dashboard-task-priority" style={{ color: priorityColor(task.priority) }}>{task.priority}</span>
              <span className="dashboard-task-title">{task.title}</span>
              <span className="dashboard-task-date">{fmtDate(task.deadline)}</span>
            </div>
          ))}
          {tasks.every(task => task.status === "done") && <div className="empty-state"><h3>{t("ui.noOpenTasks")}</h3></div>}
          <Link className="dashboard-card-link" to="/tasks">{t("nav.tasks")}</Link>
        </div>
      </div>

      <footer className="dashboard-footer">
        <span>{t("auth.footerFirm")}</span>
        <span>{t("auth.footerValues")}</span>
      </footer>
    </div>
  );
}
