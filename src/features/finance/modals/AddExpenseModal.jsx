import { useState } from "react";
import { Modal } from "@/components/ui";

export default function AddExpenseModal({ onClose, clients, cases, onSave }) {
  const [form, setForm] = useState({ description: "", amount: "", type: "invoice", clientId: "", caseId: "", date: new Date().toISOString().slice(0, 10), status: "outstanding" });
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const save = () => { if (!form.description || !form.amount) return; onSave({ ...form, amount: parseFloat(form.amount), clientId: parseInt(form.clientId), caseId: parseInt(form.caseId) }); onClose(); };

  return (
    <Modal title="Record Transaction" onClose={onClose} onSave={save} saveLabel="Record">
      <div className="form-group"><label className="form-label">Description *</label><input className="form-control" value={form.description} onChange={set("description")} placeholder="e.g. Court filing fees" /></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Amount *</label><input type="number" className="form-control" value={form.amount} onChange={set("amount")} placeholder="0.00" /></div>
        <div className="form-group"><label className="form-label">Type</label>
          <select className="form-control" value={form.type} onChange={set("type")}>
            {["invoice", "payment", "expense"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Client</label>
          <select className="form-control" value={form.clientId} onChange={set("clientId")}>
            <option value="">— Client —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Case</label>
          <select className="form-control" value={form.caseId} onChange={set("caseId")}>
            <option value="">— Case —</option>
            {cases.map(c => <option key={c.id} value={c.id}>{c.caseNumber}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" value={form.date} onChange={set("date")} /></div>
        <div className="form-group"><label className="form-label">Status</label>
          <select className="form-control" value={form.status} onChange={set("status")}>
            {["outstanding", "paid"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}
