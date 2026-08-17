import { useState } from "react";
import { FilterPanel, StatusBadge } from "@/components/ui";
import { useI18n } from "@/i18n";
import { I } from "@/shared/constants";
import { fmtCurrency, fmtDate } from "@/shared/utils";
import "../clients.css";

export default function ClientsPage({ clients, clientsState, search, setSearch, onSelect }) {
  const { t } = useI18n();
  const [statusFilter, setStatusFilter] = useState("all");
  const filtered = clients.filter(c =>
    (statusFilter === "all" || c.status === statusFilter) && (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.nationalId.includes(search) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="clients-page">
      <FilterPanel
        title={t("ui.filters")}
        clearLabel={t("ui.clearFilters")}
        canClear={Boolean(search) || statusFilter !== "all"}
        onClear={() => { setSearch(""); setStatusFilter("all"); }}
      >
        <div className="filter-field filter-field-search">
          <label>{t("ui.search")}</label>
          <div className="search-bar">
            <span className="search-icon">{I.search}</span>
            <input placeholder={t("ui.searchClients")} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="filter-field">
          <label>{t("ui.status")}</label>
          <select className="form-control" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
            <option value="all">{t("ui.allStatuses")}</option>
            <option value="active">{t("status.active")}</option>
            <option value="inactive">{t("status.inactive", "Inactive")}</option>
          </select>
        </div>
      </FilterPanel>
      <div className="card clients-results-card">
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
                    <div className="clients-identity">
                      <div className="avatar clients-avatar">{c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                      <div className="clients-identity-copy">
                        <div className="bold">{c.name}</div>
                        <div className="clients-email">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{c.nationalId}</td>
                  <td>{c.phone}</td>
                  <td className="bold">{c.activeCases}</td>
                  <td>{fmtCurrency(c.totalFees)}</td>
                  <td className={c.totalFees > c.paidFees ? "clients-balance-due" : "clients-balance-paid"}>
                    {c.totalFees > c.paidFees ? fmtCurrency(c.totalFees - c.paidFees) : `${t("ui.paid")} ✓`}
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="clients-last-activity">{fmtDate(c.lastActivity)}</td>
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
