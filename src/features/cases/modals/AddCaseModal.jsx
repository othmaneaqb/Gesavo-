import { useState } from "react";
import { Modal } from "@/components/ui";

export default function AddCaseModal({ onClose, onSave, clients, initialValues, title = "Open New Case", saveLabel = "Open Case" }) {
  const [form, setForm] = useState(initialValues || { caseNumber: "", title: "", clientId: "", type: "civil", court: "", judge: "", status: "active", nextHearing: "" });
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const save = async () => { if (!form.title || !form.clientId) return; const saved = await onSave({ ...form, clientId: parseInt(form.clientId) }); if (saved !== false) onClose(); };

  return (
    <Modal title={title} onClose={onClose} onSave={save} saveLabel={saveLabel}>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Case Number</label><input className="form-control" value={form.caseNumber} onChange={set("caseNumber")} placeholder="2025-CIV-XXX" /></div>
        <div className="form-group"><label className="form-label">Type</label>
          <select className="form-control" value={form.type} onChange={set("type")}>
            {["civil", "criminal", "commercial", "family", "administrative"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group"><label className="form-label">Status</label>
        <select className="form-control" value={form.status} onChange={set("status")}>
          {["active", "pending", "closed"].map(status => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}
        </select>
      </div>
      <div className="form-group"><label className="form-label">Case Title *</label><input className="form-control" value={form.title} onChange={set("title")} placeholder="Brief description" /></div>
      <div className="form-group"><label className="form-label">Client *</label>
        <select className="form-control" value={form.clientId} onChange={set("clientId")}>
          <option value="">— Select Client —</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Court</label><input className="form-control" value={form.court} onChange={set("court")} placeholder="Court name" /></div>
        <div className="form-group"><label className="form-label">Judge</label><input className="form-control" value={form.judge} onChange={set("judge")} placeholder="Judge name" /></div>
      </div>
      <div className="form-group"><label className="form-label">Next Hearing</label><input type="date" className="form-control" value={form.nextHearing} onChange={set("nextHearing")} /></div>
    </Modal>
  );
}
