import { StatusBadge } from "@/components/ui";
import { useI18n } from "@/i18n";
import { I } from "@/shared/constants";
import { fmtCurrency, fmtDate } from "@/shared/utils";

export default function ClientsPage({ clients, clientsState, search, setSearch, onSelect }) {
  const { t } = useI18n();
  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.nationalId.includes(search) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div className="search-bar">
          <span className="search-icon">{I.search}</span>
          <input placeholder={t("ui.searchClients")} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          {clientsState?.loading && <div className="empty-state"><h3>{t("common.loading")}</h3></div>}
          {!clientsState?.loading && clientsState?.error && (
            <div className="empty-state">
              <h3>{t("ui.clientsUnavailable")}</h3>
              <p>{clientsState.error}</p>
            </div>
          )}
          <table>
            <thead>
              <tr>
                <th>{t("ui.client")}</th>
                <th>{t("ui.nationalId")}</th>
                <th>{t("ui.phone")}</th>
                <th>{t("ui.activeCases")}</th>
                <th>{t("ui.totalFees")}</th>
                <th>{t("ui.balance")}</th>
                <th>{t("ui.status")}</th>
                <th>{t("ui.lastActivity")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => onSelect(c)}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                      <div>
                        <div className="bold">{c.name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{c.nationalId}</td>
                  <td>{c.phone}</td>
                  <td className="bold">{c.activeCases}</td>
                  <td>{fmtCurrency(c.totalFees)}</td>
                  <td style={{ color: c.totalFees > c.paidFees ? "var(--danger)" : "var(--success)" }}>
                    {c.totalFees > c.paidFees ? fmtCurrency(c.totalFees - c.paidFees) : `${t("ui.paid")} ✓`}
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{fmtDate(c.lastActivity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!clientsState?.loading && !clientsState?.error && filtered.length === 0 && (
            <div className="empty-state"><div className="icon">{I.clients}</div><h3>{t("ui.noClientsFound")}</h3><p>{t("ui.tryDifferentSearch")}</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
