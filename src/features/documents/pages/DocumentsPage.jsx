import { useI18n } from "@/i18n";
import { I } from "@/shared/constants";
import { fmtDate } from "@/shared/utils";

export default function DocumentsPage({ docs, cases, clients, search, setSearch }) {
  const { t } = useI18n();
  const filtered = docs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.desc.toLowerCase().includes(search.toLowerCase())
  );
  const getCase = id => cases.find(c => c.id === id);
  const getClient = id => clients.find(c => c.id === id);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div className="search-bar">
          <span className="search-icon">{I.search}</span>
          <input placeholder={t("ui.searchDocuments")} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>{t("ui.file")}</th><th>{t("ui.type")}</th><th>{t("ui.case")}</th><th>{t("ui.client")}</th><th>{t("ui.date")}</th><th>{t("ui.size")}</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td>
                    <div className="bold">{d.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{d.desc}</div>
                  </td>
                  <td><span className="badge badge-gold">{d.type.toUpperCase()}</span></td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{getCase(d.caseId)?.caseNumber}</td>
                  <td style={{ fontSize: 12 }}>{getClient(d.clientId)?.name}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{fmtDate(d.date)}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{d.size}</td>
                  <td><button className="btn btn-ghost btn-sm" aria-label={t("ui.download")}>{I.download}</button></td>
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
