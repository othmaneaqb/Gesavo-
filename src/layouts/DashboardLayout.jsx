import { useMemo, useState } from "react";
import { fmtDate } from "@/shared/utils";
import { I } from "@/shared/constants";
import logo from "@/assets/image.png";

export default function DashboardLayout({
  page,
  setPage,
  selectedClient,
  selectedCase,
  setSelectedClient,
  setSelectedCase,
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
  const activeRoute = navItems.find(n => n.key === page);
  const activeAction = activeRoute?.action;
  const showAction = activeAction && (
    !activeAction.hideWhenDetail ||
    (activeAction.hideWhenDetail === "client" && !selectedClient) ||
    (activeAction.hideWhenDetail === "case" && !selectedCase)
  );
  const unreadCount = notifications.length;
  const groupedNotifications = useMemo(() => ({
    urgent: notifications.filter(item => item.type === "danger" || item.type === "warning"),
    normal: notifications.filter(item => item.type !== "danger" && item.type !== "warning"),
  }), [notifications]);

  const openNotification = notification => {
    if (notification.page) {
      setPage(notification.page);
      setSelectedClient(null);
      setSelectedCase(null);
    }
    setNotificationsOpen(false);
  };

  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={logo} alt={"A\u00EFt El Hadj Avocat"} />
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {navItems.filter(item => item.section !== "system").map(n => (
            <div key={n.key} className={`nav-item ${page === n.key ? "active" : ""}`} onClick={() => { setPage(n.key); setSelectedClient(null); setSelectedCase(null); }}>
              <span className="icon">{n.icon}</span>
              <span>{n.label}</span>
            </div>
          ))}
          <div className="nav-section-label" style={{ marginTop: 8 }}>System</div>
          {navItems.filter(item => item.section === "system").map(n => (
            <div key={n.key} className={`nav-item ${page === n.key ? "active" : ""}`} onClick={() => { setPage(n.key); setSelectedClient(null); setSelectedCase(null); }}>
              <span className="icon">{n.icon}</span>
              <span>{n.label}</span>
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
            Log out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <header className="topbar">
          <h2 className="page-title">
            {selectedClient ? selectedClient.name : selectedCase ? selectedCase.title : activeRoute?.label}
          </h2>
          <div className="topbar-actions">
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
                      <strong>Notifications</strong>
                      <span>{"Alertes g\u00E9n\u00E9r\u00E9es depuis les donn\u00E9es du cabinet"}</span>
                    </div>
                    <button type="button" className="text-link" onClick={() => setNotificationsOpen(false)}>Fermer</button>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="notification-empty">{"Aucune alerte importante pour le moment."}</div>
                  ) : (
                    <>
                      {groupedNotifications.urgent.length > 0 && (
                        <div className="notification-group">
                          <div className="notification-group-title">Prioritaire</div>
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
                          <div className="notification-group-title">Suivi</div>
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
                {activeAction.icon} {activeAction.label}
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
