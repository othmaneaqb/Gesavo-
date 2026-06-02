import { useState } from "react";
import { Modal } from "@/components/ui";
import { useI18n } from "@/i18n";

export default function AddClientModal({ onClose, onSave, initialValues, title = "Add New Client", saveLabel = "Add Client" }) {
  const { t } = useI18n();
  const [form, setForm] = useState(initialValues || { name: "", nationalId: "", phone: "", email: "", address: "", notes: "" });
  const set = key => event => setForm(prev => ({ ...prev, [key]: event.target.value }));
  const save = async () => {
    if (!form.name) return;
    const saved = await onSave(form);
    if (saved !== false) onClose();
  };

  const modalTitle = title === "Edit Client" ? t("forms.editClient") : t("forms.addClient");
  const modalSave = saveLabel === "Save Changes" ? t("forms.saveChanges") : t("forms.addClientSave");

  return (
    <Modal title={modalTitle} onClose={onClose} onSave={save} saveLabel={modalSave}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t("forms.clientFullName")} *</label>
          <input className="form-control" value={form.name} onChange={set("name")} placeholder={t("forms.clientFullNamePlaceholder")} />
        </div>
        <div className="form-group">
          <label className="form-label">{t("ui.nationalId")}</label>
          <input className="form-control" value={form.nationalId} onChange={set("nationalId")} placeholder={t("forms.nationalIdPlaceholder")} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t("ui.phone")}</label>
          <input className="form-control" value={form.phone} onChange={set("phone")} placeholder={t("forms.phonePlaceholder")} />
        </div>
        <div className="form-group">
          <label className="form-label">{t("auth.email")}</label>
          <input className="form-control" value={form.email} onChange={set("email")} placeholder={t("forms.emailPlaceholder")} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">{t("settings.address")}</label>
        <input className="form-control" value={form.address} onChange={set("address")} placeholder={t("forms.addressPlaceholder")} />
      </div>
      <div className="form-group">
        <label className="form-label">{t("forms.internalNotes")}</label>
        <textarea className="form-control" value={form.notes} onChange={set("notes")} placeholder={t("forms.internalNotesPlaceholder")} rows={3} />
      </div>
    </Modal>
  );
}
