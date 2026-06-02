import { useState } from "react";
import { Modal } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";

export default function AddHearingModal({ onClose, onSave, onDelete, cases, initialValues = null }) {
  const { t } = useI18n();
  const isEditing = Boolean(initialValues);
  const [form, setForm] = useState({
    title: initialValues?.title || "",
    date: initialValues?.date || "",
    time: initialValues?.time || "",
    court: initialValues?.court || "",
    caseId: initialValues?.caseId || "",
    status: initialValues?.status || "upcoming",
    outcome: initialValues?.outcome || "",
  });

  const set = key => event => setForm(prev => ({ ...prev, [key]: event.target.value }));

  const save = async () => {
    if (!form.title || !form.date) return;
    const saved = await onSave({
      ...form,
      caseId: form.caseId ? parseInt(form.caseId) : null,
    });
    if (saved !== false) onClose();
  };

  const deleteHearing = async () => {
    if (!onDelete || !initialValues) return;
    const deleted = await onDelete(initialValues.id);
    if (deleted !== false) onClose();
  };

  return (
    <Modal
      title={isEditing ? t("forms.editHearing") : t("forms.scheduleHearing")}
      onClose={onClose}
      onSave={save}
      saveLabel={isEditing ? t("forms.saveChanges") : t("forms.schedule")}
    >
      <div className="form-group">
        <label className="form-label">{t("forms.hearingTitle")} *</label>
        <input
          className="form-control"
          value={form.title}
          onChange={set("title")}
          placeholder={t("forms.hearingPlaceholder")}
        />
      </div>

      <div className="form-group">
        <label className="form-label">{t("forms.linkedCase")}</label>
        <select className="form-control" value={form.caseId} onChange={set("caseId")}>
          <option value="">— {t("forms.selectCase")} —</option>
          {cases.map(caseItem => (
            <option key={caseItem.id} value={caseItem.id}>
              {caseItem.caseNumber} — {caseItem.title}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t("ui.date")} *</label>
          <input type="date" className="form-control" value={form.date} onChange={set("date")} />
        </div>
        <div className="form-group">
          <label className="form-label">{t("forms.time")}</label>
          <input type="time" className="form-control" value={form.time} onChange={set("time")} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">{t("ui.court")}</label>
        <input
          className="form-control"
          value={form.court}
          onChange={set("court")}
          placeholder={t("forms.courtPlaceholder")}
        />
      </div>

      {isEditing && (
        <>
          <div className="form-group">
            <label className="form-label">{t("ui.status")}</label>
            <select className="form-control" value={form.status} onChange={set("status")}>
              <option value="upcoming">{t("status.upcoming")}</option>
              <option value="completed">{t("status.completed")}</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t("ui.outcome")}</label>
            <textarea
              className="form-control"
              rows={3}
              value={form.outcome}
              onChange={set("outcome")}
              placeholder={t("forms.outcomePlaceholder")}
            />
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <button className="btn btn-danger" type="button" onClick={deleteHearing}>
              {t("forms.deleteHearing")}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
