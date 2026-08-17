import { useState } from "react";
import { Modal } from "@/components/ui";

export default function AddTaskModal({ onClose, onSave, cases, team }) {
  const [form, setForm] = useState({ title: "", assigneeId: "", priority: "normal", deadline: "", caseId: "" });
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const save = async () => { if (!form.title) return; const saved = await onSave({ ...form, caseId: form.caseId ? parseInt(form.caseId) : null, assigneeId: form.assigneeId ? parseInt(form.assigneeId) : null }); if (saved !== false) onClose(); };

  return (
    <Modal title="Create Task" onClose={onClose} onSave={save} saveLabel="Create Task">
      <div className="form-group"><label className="form-label">Task Title *</label><input className="form-control" value={form.title} onChange={set("title")} placeholder="Task description" /></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Assignee</label>
          <select className="form-control" value={form.assigneeId} onChange={set("assigneeId")}>
            <option value="">— Assign to —</option>
            {team.map(member => <option key={member.id} value={member.id}>{member.display_name} ({member.role})</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Priority</label>
          <select className="form-control" value={form.priority} onChange={set("priority")}>
            {["urgent", "high", "normal", "low"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Deadline</label><input type="date" className="form-control" value={form.deadline} onChange={set("deadline")} /></div>
        <div className="form-group"><label className="form-label">Linked Case</label>
          <select className="form-control" value={form.caseId} onChange={set("caseId")}>
            <option value="">— Optional —</option>
            {cases.map(c => <option key={c.id} value={c.id}>{c.caseNumber}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}
