import { useState } from "react";
import { Modal } from "@/components/ui";

export default function UploadDocModal({ onClose, cases, clients, onSave }) {
  const [form, setForm] = useState({ name: "", desc: "", type: "pdf", size: "—", caseId: "", clientId: "", date: new Date().toISOString().slice(0, 10) });
  const [drag, setDrag] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const save = () => { if (!form.name) return; onSave({ ...form, caseId: parseInt(form.caseId), clientId: parseInt(form.clientId) }); onClose(); };

  return (
    <Modal title="Upload Document" onClose={onClose} onSave={save} saveLabel="Upload">
      <div className={`drop-zone ${drag ? "drag-over" : ""}`} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}>
        <div className="icon">📁</div>
        <div style={{ fontWeight: 500 }}>Drag & drop files here</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>PDF, DOCX, JPG, PNG supported</div>
      </div>
      <div style={{ margin: "16px 0", textAlign: "center", fontSize: 12, color: "var(--muted)" }}>— or fill in manually —</div>
      <div className="form-group"><label className="form-label">File Name *</label><input className="form-control" value={form.name} onChange={set("name")} placeholder="filename.pdf" /></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Type</label>
          <select className="form-control" value={form.type} onChange={set("type")}>
            {["pdf", "docx", "jpg", "png"].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" value={form.date} onChange={set("date")} /></div>
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
      <div className="form-group"><label className="form-label">Description</label><input className="form-control" value={form.desc} onChange={set("desc")} placeholder="Brief description…" /></div>
    </Modal>
  );
}
