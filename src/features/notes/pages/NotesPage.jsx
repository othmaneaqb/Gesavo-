import { useState } from "react";
import { I } from "@/shared/constants";
import { fmtDate } from "@/shared/utils";

export default function NotesPage({ clients, cases }) {
  const [notes, setNotes] = useState([
    { id: 1, title: "Al-Rashid — Strategy Notes", body: "Consider settling the property dispute before next hearing. Client is open to negotiation if price is within 10% of valuation.", clientId: 1, date: "2025-07-10" },
    { id: 2, title: "Tazi — Urgent Points", body: "Partnership agreement has ambiguous clause regarding profit distribution. Needs expert review before court date.", clientId: 5, date: "2025-07-09" },
  ]);
  const [editing, setEditing] = useState(null);
  const [newNote, setNewNote] = useState({ title: "", body: "", clientId: "" });

  const getClient = id => clients.find(c => c.id === id);

  const save = () => {
    if (!newNote.title.trim()) return;
    setNotes(prev => [{ ...newNote, id: Date.now(), date: new Date().toISOString().slice(0, 10) }, ...prev]);
    setNewNote({ title: "", body: "", clientId: "" });
    setEditing(null);
  };

  return (
    <div>
      {!editing ? (
        <div>
          <button className="btn btn-primary mb-6" onClick={() => setEditing("new")}>{I.add} New Note</button>
          <div className="grid-3">
            {notes.map(n => {
              const client = getClient(n.clientId);
              return (
                <div key={n.id} className="card" style={{ cursor: "pointer" }} onClick={() => setEditing(n)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <h4 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 16, lineHeight: 1.3 }}>{n.title}</h4>
                  </div>
                  {client && <div style={{ fontSize: 11, color: "var(--gold)", marginBottom: 8 }}>↳ {client.name}</div>}
                  <p style={{ fontSize: 13, color: "var(--slate)", lineHeight: 1.6 }}>{n.body.slice(0, 120)}{n.body.length > 120 ? "…" : ""}</p>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>{fmtDate(n.date)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 640 }}>
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => setEditing(null)}>{I.back} Back</button>
          <div className="card">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-control" value={editing === "new" ? newNote.title : editing.title} onChange={e => editing === "new" ? setNewNote(p => ({ ...p, title: e.target.value })) : setEditing(p => ({ ...p, title: e.target.value }))} placeholder="Note title…" />
            </div>
            <div className="form-group">
              <label className="form-label">Client (optional)</label>
              <select className="form-control" value={editing === "new" ? newNote.clientId : editing.clientId} onChange={e => editing === "new" ? setNewNote(p => ({ ...p, clientId: parseInt(e.target.value) })) : setEditing(p => ({ ...p, clientId: parseInt(e.target.value) }))}>
                <option value="">— Select Client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Note</label>
              <textarea className="form-control" rows={6} value={editing === "new" ? newNote.body : editing.body} onChange={e => editing === "new" ? setNewNote(p => ({ ...p, body: e.target.value })) : setEditing(p => ({ ...p, body: e.target.value }))} placeholder="Write your note…" />
            </div>
            <button className="btn btn-primary" onClick={editing === "new" ? save : () => { setNotes(prev => prev.map(n => n.id === editing.id ? editing : n)); setEditing(null); }}>Save Note</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODALS ───────────────────────────────────────────────────────────────────
