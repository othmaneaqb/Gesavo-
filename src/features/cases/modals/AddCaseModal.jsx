import { useState } from "react";
import { Modal } from "@/components/ui";
import { useI18n } from "@/i18n";

export default function AddCaseModal({ onClose, onSave, clients, initialValues, title = "Open New Case", saveLabel = "Open Case" }) {
  const { t } = useI18n();
  const [form, setForm] = useState(initialValues || { caseNumber: "", title: "", clientId: "", type: "civil", court: "", judge: "", status: "active", nextHearing: "" });
  const set = key => event => setForm(prev => ({ ...prev, [key]: event.target.value }));
  const save = async () => {
    if (!form.title || !form.clientId) return;
    const saved = await onSave({ ...form, clientId: parseInt(form.clientId) });
    if (saved !== false) onClose();
  };

  const modalTitle = title === "Edit Case" ? t("forms.editCase") : t("forms.openCase");
  const modalSave = saveLabel === "Save Changes" ? t("forms.saveChanges") : t("forms.openCaseSave");

  return (
    <Modal title={modalTitle} onClose={onClose} onSave={save} saveLabel={modalSave}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t("forms.caseNumber")}</label>
          <input className="form-control" value={form.caseNumber} onChange={set("caseNumber")} placeholder={t("forms.caseNumberPlaceholder")} />
        </div>
        <div className="form-group">
          <label className="form-label">{t("ui.type")}</label>
          <select className="form-control" value={form.type} onChange={set("type")}>
            {["civil", "criminal", "commercial", "family", "administrative"].map(type => (
              <option key={type} value={type}>{t(`status.${type}`, type.charAt(0).toUpperCase() + type.slice(1))}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">{t("ui.status")}</label>
        <select className="form-control" value={form.status} onChange={set("status")}>
          {["active", "pending", "closed"].map(status => (
            <option key={status} value={status}>{t(`status.${status}`, status.charAt(0).toUpperCase() + status.slice(1))}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">{t("forms.caseTitle")} *</label>
        <input className="form-control" value={form.title} onChange={set("title")} placeholder={t("forms.caseTitlePlaceholder")} />
      </div>
      <div className="form-group">
        <label className="form-label">{t("ui.client")} *</label>
        <select className="form-control" value={form.clientId} onChange={set("clientId")}>
          <option value="">— {t("forms.selectClient")} —</option>
          {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
        </select>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t("ui.court")}</label>
          <input className="form-control" value={form.court} onChange={set("court")} placeholder={t("forms.courtPlaceholder")} />
        </div>
        <div className="form-group">
          <label className="form-label">{t("ui.judge")}</label>
          <input className="form-control" value={form.judge} onChange={set("judge")} placeholder={t("forms.judgePlaceholder")} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">{t("ui.nextHearing")}</label>
        <input type="date" className="form-control" value={form.nextHearing} onChange={set("nextHearing")} />
      </div>
    </Modal>
  );
}
