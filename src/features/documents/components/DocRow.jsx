import { I } from "@/shared/constants";
import { fmtDate } from "@/shared/utils";
import { useI18n } from "@/i18n";
import { getDocumentDownloadUrl } from "@/services/documents.service";

export default function DocRow({ doc, onEdit, onDelete }) {
  const { t } = useI18n();
  const icons = { pdf: I.pdf, docx: I.docx, jpg: I.img, jpeg: I.img, png: I.img };

  const downloadDocument = () => {
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
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F0EDE7" }}>
      <span style={{ fontSize: 20 }}>{icons[doc.type] || I.doc}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 13.5 }}>{doc.name}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
          {[doc.desc, doc.size, fmtDate(doc.date)].filter(Boolean).join(" · ")}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button className="btn btn-ghost btn-sm" onClick={downloadDocument} title={t("ui.download")}>
          {I.download} {t("ui.download")}
        </button>
        {onEdit && (
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(doc)} title={t("ui.edit")}>
            {I.edit}
          </button>
        )}
        {onDelete && (
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(doc.id)} title={t("ui.delete")}>
            {I.del}
          </button>
        )}
      </div>
    </div>
  );
}
