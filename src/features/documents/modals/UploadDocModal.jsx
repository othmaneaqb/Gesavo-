import { useState } from "react";
import { Modal } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";

export default function UploadDocModal({
  onClose,
  cases,
  clients,
  onSave,
  initialValues = null,
  title = null,
  saveLabel = null,
}) {
  const { t } = useI18n();
  const isEditing = Boolean(initialValues);
  const [form, setForm] = useState({
    name: initialValues?.name || "",
    desc: initialValues?.desc || "",
    caseId: initialValues?.caseId || "",
    clientId: initialValues?.clientId || "",
    file: null,
  });
  const [drag, setDrag] = useState(false);

  const set = key => event => setForm(prev => ({ ...prev, [key]: event.target.value }));
  const setFile = file => setForm(prev => ({ ...prev, file, name: file?.name || prev.name }));

  const save = async () => {
    if (!form.name || (!isEditing && !form.file)) return;
    const saved = await onSave({
      ...form,
      caseId: form.caseId ? parseInt(form.caseId) : null,
      clientId: form.clientId ? parseInt(form.clientId) : null,
    });
    if (saved !== false) onClose();
  };

  return (
    <Modal
      title={title || (isEditing ? t("forms.editDocument") : t("forms.uploadDocument"))}
      onClose={onClose}
      onSave={save}
      saveLabel={saveLabel || (isEditing ? t("forms.saveChanges") : t("forms.upload"))}
    >
      <div
        className={`drop-zone ${drag ? "drag-over" : ""}`}
        onDragOver={event => {
          event.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={event => {
          event.preventDefault();
          setDrag(false);
          setFile(event.dataTransfer.files?.[0] || null);
        }}
      >
        <div className="icon">📁</div>
        <div style={{ fontWeight: 500 }}>{t("forms.dragDrop")}</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>{t("forms.supportedFiles")}</div>
      </div>

      <div style={{ margin: "16px 0", textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
        — {t("forms.chooseFile")} —
      </div>

      <div className="form-group">
        <label className="form-label">{t("ui.file")}{!isEditing ? " *" : ""}</label>
        <input className="form-control" type="file" onChange={event => setFile(event.target.files?.[0] || null)} />
        {isEditing && (
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
            {t("forms.keepExistingFile")}
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">{t("forms.fileName")} *</label>
        <input
          className="form-control"
          value={form.name}
          onChange={set("name")}
          placeholder={t("forms.fileNamePlaceholder")}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t("ui.client")}</label>
          <select className="form-control" value={form.clientId} onChange={set("clientId")}>
            <option value="">— {t("ui.client")} —</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{t("ui.case")}</label>
          <select className="form-control" value={form.caseId} onChange={set("caseId")}>
            <option value="">— {t("ui.case")} —</option>
            {cases.map(caseItem => (
              <option key={caseItem.id} value={caseItem.id}>{caseItem.caseNumber}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">{t("invoice.description")}</label>
        <input
          className="form-control"
          value={form.desc}
          onChange={set("desc")}
          placeholder={t("forms.briefDescription")}
        />
      </div>
    </Modal>
  );
}
