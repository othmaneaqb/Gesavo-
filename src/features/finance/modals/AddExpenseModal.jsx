import { useState } from "react";
import { Modal } from "@/components/ui";

export default function AddExpenseModal({ onClose, clients, cases, onSave }) {
  const [form, setForm] = useState({ description: "", amount: "", type: "invoice", clientId: "", caseId: "", date: new Date().toISOString().slice(0, 10), status: "outstanding" });
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setType = event => {
    const type = event.target.value;
    setForm(previous => ({
      ...previous,
      type,
      status: type === "payment" ? "paid" : type === "expense" ? "" : "outstanding",
    }));
  };
  const setClient = event => {
    const clientId = event.target.value;
    setForm(previous => ({ ...previous, clientId, caseId: "" }));
  };
  const save = async () => {
    const amount = Number(form.amount);
    if (!form.description || !form.clientId || !Number.isFinite(amount) || amount <= 0) return;
    const saved = await onSave({ ...form, amount, clientId: parseInt(form.clientId), caseId: form.caseId ? parseInt(form.caseId) : null });
    if (saved !== false) onClose();
  };
  const availableCases = cases.filter(caseItem => !form.clientId || caseItem.clientId === Number(form.clientId));

  return (
    <Modal title="Record Transaction" onClose={onClose} onSave={save} saveLabel="Record">
      <div className="form-group"><label className="form-label">Description *</label><input className="form-control" value={form.description} onChange={set("description")} placeholder="e.g. Court filing fees" /></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Amount *</label><input type="number" min="0.01" step="0.01" className="form-control" value={form.amount} onChange={set("amount")} placeholder="0.00" /></div>
        <div className="form-group"><label className="form-label">Type</label>
          <select className="form-control" value={form.type} onChange={setType}>
            {["invoice", "payment", "expense"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Client</label>
          <select className="form-control" value={form.clientId} onChange={setClient}>
            <option value="">— Client —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Case</label>
          <select className="form-control" value={form.caseId} onChange={set("caseId")}>
            <option value="">— Case —</option>
            {availableCases.map(c => <option key={c.id} value={c.id}>{c.caseNumber}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" value={form.date} onChange={set("date")} /></div>
        {form.type === "invoice" && <div className="form-group"><label className="form-label">Status</label>
          <select className="form-control" value={form.status} onChange={set("status")}>
            {["outstanding", "paid"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>}
      </div>
    </Modal>
  );
}
