import { useState } from "react";
import { FilterPanel, StatusBadge } from "@/components/ui";
import { useI18n } from "@/i18n";
import { I } from "@/shared/constants";
import { fmtDate } from "@/shared/utils";
import "@/styles/list-pages.css";

export default function CasesPage({ cases, clients, search, setSearch, onSelect }) {
  const { t } = useI18n();
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const getClient = id => clients.find(c => c.id === id);
  const filtered = cases.filter(c =>
    (statusFilter === "all" || c.status === statusFilter) &&
    (typeFilter === "all" || c.type === typeFilter) && (
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.court.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="list-page cases-page">
      <FilterPanel
        title={t("ui.filters")}
        clearLabel={t("ui.clearFilters")}
        canClear={Boolean(search) || statusFilter !== "all" || typeFilter !== "all"}
        onClear={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); }}
      >
        <div className="filter-field filter-field-search">
          <label>{t("ui.search")}</label>
          <div className="search-bar">
            <span className="search-icon">{I.search}</span>
            <input placeholder={t("ui.searchCases")} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="filter-field">
          <label>{t("ui.status")}</label>
          <select className="form-control" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
            <option value="all">{t("ui.allStatuses")}</option>
            <option value="active">{t("status.active")}</option>
            <option value="urgent">{t("status.urgent")}</option>
            <option value="closed">{t("status.closed")}</option>
          </select>
        </div>
        <div className="filter-field">
          <label>{t("ui.type")}</label>
          <select className="form-control" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}>
            <option value="all">{t("ui.allTypes")}</option>
            <option value="civil">{t("status.civil")}</option>
            <option value="criminal">{t("status.criminal")}</option>
            <option value="commercial">{t("status.commercial")}</option>
          </select>
        </div>
      </FilterPanel>
      <div className="card list-results-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("ui.case")}</th>
                <th>{t("ui.client")}</th>
                <th>{t("ui.type")}</th>
                <th>{t("ui.court")}</th>
                <th>{t("ui.judge")}</th>
                <th>{t("ui.nextHearing")}</th>
                <th>{t("ui.status")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const client = getClient(c.clientId);
                return (
                  <tr key={c.id} onClick={() => onSelect(c)}>
                    <td>
                      <div className="list-primary-text">{c.title}</div>
                      <div className="list-secondary-text">{c.caseNumber}</div>
                    </td>
                    <td>{client?.name}</td>
                    <td><span className={`badge badge-${c.type}`}>{t(`status.${c.type}`, c.type)}</span></td>
                    <td className="list-muted-cell">{c.court}</td>
                    <td>{c.judge}</td>
                    <td className="list-gold-cell">{fmtDate(c.nextHearing)}</td>
                    <td><StatusBadge status={c.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="empty-state"><h3>{t("ui.noCasesFound")}</h3><p>{t("ui.createCaseHint")}</p></div>}
        </div>
      </div>
    </div>
  );
}
