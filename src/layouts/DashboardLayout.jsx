import { I } from "@/shared/constants";

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
  children,
  modals,
}) {
  const activeRoute = navItems.find(n => n.key === page);
  const activeAction = activeRoute?.action;
  const showAction = activeAction && (
    !activeAction.hideWhenDetail ||
    (activeAction.hideWhenDetail === "client" && !selectedClient) ||
    (activeAction.hideWhenDetail === "case" && !selectedCase)
  );

  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Lexis Pro</h1>
          <span>Law Firm Management</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {navItems.map(n => (
            <div key={n.key} className={`nav-item ${page === n.key ? "active" : ""}`} onClick={() => { setPage(n.key); setSelectedClient(null); setSelectedCase(null); }}>
              <span className="icon">{n.icon}</span>
              <span>{n.label}</span>
            </div>
          ))}
          <div className="nav-section-label" style={{ marginTop: 8 }}>System</div>
          <div className="nav-item"><span className="icon">{I.settings}</span><span>Settings</span></div>
        </nav>
        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="avatar">KA</div>
            <div className="user-info">
              <div className="user-name">Karim Amine</div>
              <div className="user-role">Lead Attorney</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <header className="topbar">
          <h2 className="page-title">
            {selectedClient ? selectedClient.name : selectedCase ? selectedCase.title : activeRoute?.label}
          </h2>
          <div className="topbar-actions">
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
