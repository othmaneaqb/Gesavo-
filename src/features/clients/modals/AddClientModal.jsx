import { useState } from "react";
import { Modal } from "@/components/ui";

export default function AddClientModal({ onClose, onSave, initialValues, title = "Add New Client", saveLabel = "Add Client" }) {
  const [form, setForm] = useState(initialValues || { name: "", nationalId: "", phone: "", email: "", address: "", notes: "" });
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const save = async () => {
    if (!form.name) return;
    const saved = await onSave(form);
    if (saved !== false) onClose();
  };

  return (
    <Modal title={title} onClose={onClose} onSave={save} saveLabel={saveLabel}>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Full Name *</label><input className="form-control" value={form.name} onChange={set("name")} placeholder="Client full name" /></div>
        <div className="form-group"><label className="form-label">National ID</label><input className="form-control" value={form.nationalId} onChange={set("nationalId")} placeholder="ID number" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={set("phone")} placeholder="+1 234 567 8900" /></div>
        <div className="form-group"><label className="form-label">Email</label><input className="form-control" value={form.email} onChange={set("email")} placeholder="email@example.com" /></div>
      </div>
      <div className="form-group"><label className="form-label">Address</label><input className="form-control" value={form.address} onChange={set("address")} placeholder="City, Country" /></div>
      <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" value={form.notes} onChange={set("notes")} placeholder="Internal notes…" rows={3} /></div>
    </Modal>
  );
}
