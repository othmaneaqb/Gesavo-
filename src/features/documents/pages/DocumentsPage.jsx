import { useState } from "react";
import { FilterPanel } from "@/components/ui";
import { useI18n } from "@/i18n";
import { I } from "@/shared/constants";
import { fmtDate } from "@/shared/utils";
import DocumentDownloadButton from "../components/DocumentDownloadButton";
import "@/styles/list-pages.css";

export default function DocumentsPage({ docs, cases, clients, search, setSearch }) {
  const { t } = useI18n();
  const [typeFilter, setTypeFilter] = useState("all");
  const filtered = docs.filter(d =>
    (typeFilter === "all" || d.type.toLowerCase() === typeFilter) && (
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.desc.toLowerCase().includes(search.toLowerCase())
    )
  );
  const getCase = id => cases.find(c => c.id === id);
  const getClient = id => clients.find(c => c.id === id);

  return (
    <div className="list-page documents-page">
      <FilterPanel
        title={t("ui.filters")}
        clearLabel={t("ui.clearFilters")}
        canClear={Boolean(search) || typeFilter !== "all"}
        onClear={() => { setSearch(""); setTypeFilter("all"); }}
      >
        <div className="filter-field filter-field-search">
          <label>{t("ui.search")}</label>
          <div className="search-bar">
            <span className="search-icon">{I.search}</span>
            <input placeholder={t("ui.searchDocuments")} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="filter-field">
          <label>{t("ui.type")}</label>
          <select className="form-control" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}>
            <option value="all">{t("ui.allTypes")}</option>
            {[...new Set(docs.map(document => document.type.toLowerCase()))].map(type => <option key={type} value={type}>{type.toUpperCase()}</option>)}
          </select>
        </div>
      </FilterPanel>
      <div className="card list-results-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>{t("ui.file")}</th><th>{t("ui.type")}</th><th>{t("ui.case")}</th><th>{t("ui.client")}</th><th>{t("ui.date")}</th><th>{t("ui.size")}</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td>
                    <div className="list-primary-text">{d.name}</div>
                    <div className="list-secondary-text">{d.desc}</div>
                  </td>
                  <td><span className="badge badge-gold">{d.type.toUpperCase()}</span></td>
                  <td className="list-muted-cell">{getCase(d.caseId)?.caseNumber}</td>
                  <td>{getClient(d.clientId)?.name}</td>
                  <td className="list-date-cell">{fmtDate(d.date)}</td>
                  <td className="list-muted-cell">{d.size}</td>
                  <td><DocumentDownloadButton document={d} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="empty-state"><h3>{t("ui.noDocumentsFound")}</h3><p>{t("ui.uploadDocumentHint")}</p></div>}
        </div>
      </div>
    </div>
  );
}
