import { useState } from "react";
import { Modal } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";

export default function AddExpenseModal({ onClose, clients, cases, onSave }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    description: "",
    amount: "",
    type: "invoice",
    clientId: "",
    caseId: "",
    date: new Date().toISOString().slice(0, 10),
    status: "outstanding",
  });

  const set = key => event => setForm(prev => ({ ...prev, [key]: event.target.value }));

  const save = async () => {
    if (!form.description || !form.amount) return;
    const saved = await onSave({
      ...form,
      amount: parseFloat(form.amount),
      clientId: form.clientId ? parseInt(form.clientId) : null,
      caseId: form.caseId ? parseInt(form.caseId) : null,
    });
    if (saved !== false) onClose();
  };

  return (
    <Modal title={t("forms.recordTransaction")} onClose={onClose} onSave={save} saveLabel={t("forms.record")}>
      <div className="form-group">
        <label className="form-label">{t("invoice.description")} *</label>
        <input
          className="form-control"
          value={form.description}
          onChange={set("description")}
          placeholder={t("forms.transactionPlaceholder")}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t("ui.amount")} *</label>
          <input type="number" className="form-control" value={form.amount} onChange={set("amount")} placeholder="0.00" />
        </div>
        <div className="form-group">
          <label className="form-label">{t("ui.type")}</label>
          <select className="form-control" value={form.type} onChange={set("type")}>
            {["invoice", "payment", "expense"].map(type => (
              <option key={type} value={type}>{t(`status.${type}`)}</option>
            ))}
          </select>
        </div>
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

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t("ui.date")}</label>
          <input type="date" className="form-control" value={form.date} onChange={set("date")} />
        </div>
        <div className="form-group">
          <label className="form-label">{t("ui.status")}</label>
          <select className="form-control" value={form.status} onChange={set("status")}>
            {["outstanding", "paid"].map(status => (
              <option key={status} value={status}>{t(`status.${status}`)}</option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}
