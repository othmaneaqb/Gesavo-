import { useState } from "react";
import { Modal } from "@/components/ui";

export default function AddHearingModal({ onClose, onSave, cases }) {
  const [form, setForm] = useState({ title: "", date: "", time: "", court: "", caseId: "" });
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const save = () => { if (!form.title || !form.date) return; onSave({ ...form, caseId: parseInt(form.caseId) }); onClose(); };

  return (
    <Modal title="Schedule Hearing" onClose={onClose} onSave={save} saveLabel="Schedule">
      <div className="form-group"><label className="form-label">Hearing Title *</label><input className="form-control" value={form.title} onChange={set("title")} placeholder="e.g. Preliminary Hearing" /></div>
      <div className="form-group"><label className="form-label">Linked Case</label>
        <select className="form-control" value={form.caseId} onChange={set("caseId")}>
          <option value="">— Select Case —</option>
          {cases.map(c => <option key={c.id} value={c.id}>{c.caseNumber} — {c.title}</option>)}
        </select>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Date *</label><input type="date" className="form-control" value={form.date} onChange={set("date")} /></div>
        <div className="form-group"><label className="form-label">Time</label><input type="time" className="form-control" value={form.time} onChange={set("time")} /></div>
      </div>
      <div className="form-group"><label className="form-label">Court</label><input className="form-control" value={form.court} onChange={set("court")} placeholder="Court name" /></div>
    </Modal>
  );
}
