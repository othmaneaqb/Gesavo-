import { useI18n } from "@/i18n";
import { I } from "@/shared/constants";
import { fmtDate } from "@/shared/utils";
import { getDocumentDownloadUrl } from "@/services/documents.service";

export default function DocumentsPage({ docs, cases, clients, search, setSearch, onEdit, onDelete }) {
  const { t } = useI18n();
  const filtered = docs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.desc.toLowerCase().includes(search.toLowerCase())
  );
  const getCase = id => cases.find(c => c.id === id);
  const getClient = id => clients.find(c => c.id === id);
  const downloadDocument = (doc) => {
    const url = getDocumentDownloadUrl(doc.fileUrl);
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.name;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                  <td>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => downloadDocument(d)} aria-label={t("ui.download")} title={t("ui.download")}>
                        {I.download}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => onEdit(d)} aria-label={t("ui.edit")} title={t("ui.edit")}>
                        {I.edit}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => onDelete(d.id)} aria-label={t("ui.delete")} title={t("ui.delete")}>
                        {I.del}
                      </button>
                    </div>
                  </td>
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
