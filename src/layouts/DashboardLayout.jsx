import { useMemo, useState } from "react";
import { fmtDate } from "@/shared/utils";
import { I } from "@/shared/constants";
import { useI18n } from "@/i18n";
import logo from "@/assets/image.png";

export default function DashboardLayout({
  activeRoute,
  isDetail,
  detailTitle,
  onNavigate,
  setModal,
  navItems,
  toast,
  user,
  onLogout,
  notifications = [],
  children,
  modals,
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { language, languages, setLanguage, t } = useI18n();
  const activeAction = activeRoute?.action;
  const actionAllowed = activeAction && (
    !activeAction.roles || activeAction.roles.includes(user?.role)
  );
  const showAction = actionAllowed && (!activeAction.hideWhenDetail || !isDetail);
  const unreadCount = notifications.length;
  const groupedNotifications = useMemo(() => ({
    urgent: notifications.filter(item => item.type === "danger" || item.type === "warning"),
    normal: notifications.filter(item => item.type !== "danger" && item.type !== "warning"),
  }), [notifications]);

  const openNotification = notification => {
    if (notification.page) {
      const destination = navItems.find(item => item.key === notification.page);
      if (destination) onNavigate(destination.path);
    }
    setNotificationsOpen(false);
  };

  const getActionLabel = action => {
    const labels = {
      "add-client": "actions.addClient",
      "add-case": "actions.openCase",
      "upload-doc": "actions.uploadDocument",
      "add-hearing": "actions.scheduleHearing",
      "add-expense": "actions.recordTransaction",
      "add-task": "actions.newTask",
    };
    return t(labels[action?.modalType], action?.label);
  };

  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={logo} alt={"A\u00EFt El Hadj Avocat"} />
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">{t("common.navigation")}</div>
          {navItems.filter(item => item.section !== "system").map(n => (
            <div key={n.key} className={`nav-item ${activeRoute?.key === n.key ? "active" : ""}`} onClick={() => onNavigate(n.path)}>
              <span className="icon">{n.icon}</span>
              <span>{t(`nav.${n.key}`, n.label)}</span>
            </div>
          ))}
          <div className="nav-section-label" style={{ marginTop: 8 }}>{t("common.system")}</div>
          {navItems.filter(item => item.section === "system").map(n => (
            <div key={n.key} className={`nav-item ${activeRoute?.key === n.key ? "active" : ""}`} onClick={() => onNavigate(n.path)}>
              <span className="icon">{n.icon}</span>
              <span>{t(`nav.${n.key}`, n.label)}</span>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="avatar">
              {[user?.first_name, user?.last_name].filter(Boolean).map(part => part[0]).join("").slice(0, 2) || user?.username?.slice(0, 2).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">
                {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username}
              </div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm w-full" style={{ marginTop: 12, justifyContent: "center" }} onClick={onLogout}>
            {t("common.logout")}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <header className={`topbar ${activeRoute?.key === "dashboard" ? "topbar-dashboard" : ""}`}>
          <h2 className="page-title">
            {detailTitle || t(`nav.${activeRoute?.key}`, activeRoute?.label)}
          </h2>
          <div className="topbar-actions">
            <select className="language-select" value={language} onChange={event => setLanguage(event.target.value)} aria-label="Language">
              {languages.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
            <div className="notification-wrap">
              <button
                className={`notification-button ${unreadCount ? "has-alerts" : ""}`}
                type="button"
                onClick={() => setNotificationsOpen(prev => !prev)}
                aria-label="Notifications"
              >
                <span className="notification-bell-icon">{I.bell}</span>
                {unreadCount > 0 && <em>{unreadCount > 9 ? "9+" : unreadCount}</em>}
              </button>

              {notificationsOpen && (
                <div className="notification-panel">
                  <div className="notification-header">
                    <div>
                      <strong>{t("notifications.title")}</strong>
                      <span>{t("notifications.subtitle")}</span>
                    </div>
                    <button type="button" className="text-link" onClick={() => setNotificationsOpen(false)}>{t("common.close")}</button>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="notification-empty">{t("notifications.empty")}</div>
                  ) : (
                    <>
                      {groupedNotifications.urgent.length > 0 && (
                        <div className="notification-group">
                          <div className="notification-group-title">{t("notifications.priority")}</div>
                          {groupedNotifications.urgent.map(item => (
                            <button key={item.id} type="button" className={`notification-item ${item.type}`} onClick={() => openNotification(item)}>
                              <span className="notification-dot" />
                              <span>
                                <strong>{item.title}</strong>
                                <small>{item.message}</small>
                                <em>{fmtDate(item.date)}</em>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {groupedNotifications.normal.length > 0 && (
                        <div className="notification-group">
                          <div className="notification-group-title">{t("notifications.followUp")}</div>
                          {groupedNotifications.normal.map(item => (
                            <button key={item.id} type="button" className={`notification-item ${item.type}`} onClick={() => openNotification(item)}>
                              <span className="notification-dot" />
                              <span>
                                <strong>{item.title}</strong>
                                <small>{item.message}</small>
                                <em>{fmtDate(item.date)}</em>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            {showAction && (
              <button className="btn btn-primary" onClick={() => setModal({ type: activeAction.modalType })}>
                {activeAction.icon} {getActionLabel(activeAction)}
              </button>
            )}
          </div>
        </header>

        <div className="content">
          {children}
        </div>
      </main>

      {modals}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
