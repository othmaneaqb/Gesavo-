import { useState } from "react";
import { Modal } from "@/components/ui";

export default function UploadDocModal({ onClose, cases, clients, onSave }) {
  const [form, setForm] = useState({ name: "", desc: "", caseId: "", clientId: "", file: null });
  const [drag, setDrag] = useState(false);
  const set = key => event => setForm(prev => ({ ...prev, [key]: event.target.value }));
  const setFile = file => setForm(prev => ({ ...prev, file, name: file?.name || prev.name }));

  const save = async () => {
    if (!form.name || !form.file) return;
    const saved = await onSave({
      ...form,
      caseId: form.caseId ? parseInt(form.caseId) : null,
      clientId: form.clientId ? parseInt(form.clientId) : null,
    });
    if (saved !== false) onClose();
  };

  return (
    <Modal title="Upload Document" onClose={onClose} onSave={save} saveLabel="Upload">
      <div
        className={`drop-zone ${drag ? "drag-over" : ""}`}
        onDragOver={event => { event.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={event => {
          event.preventDefault();
          setDrag(false);
          setFile(event.dataTransfer.files?.[0] || null);
        }}
      >
        <div className="icon">📁</div>
        <div style={{ fontWeight: 500 }}>Drag & drop files here</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>PDF, DOCX, JPG, PNG supported</div>
      </div>
      <div style={{ margin: "16px 0", textAlign: "center", fontSize: 12, color: "var(--muted)" }}>— or choose a file —</div>
      <div className="form-group"><label className="form-label">File *</label><input className="form-control" type="file" onChange={event => setFile(event.target.files?.[0] || null)} /></div>
      <div className="form-group"><label className="form-label">File Name *</label><input className="form-control" value={form.name} onChange={set("name")} placeholder="filename.pdf" /></div>
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
