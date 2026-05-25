import { useState } from "react";
import { I } from "@/shared/constants";
import { fmtDate } from "@/shared/utils";

export default function NotesPage({ clients, notes, onCreate, onUpdate }) {
  const [editing, setEditing] = useState(null);
  const [newNote, setNewNote] = useState({ title: "", body: "", clientId: "" });
  const getClient = id => clients.find(client => client.id === id);

  const saveNew = async () => {
    if (!newNote.title.trim() || !newNote.body.trim()) return;
    await onCreate({ ...newNote, clientId: newNote.clientId || null });
    setNewNote({ title: "", body: "", clientId: "" });
    setEditing(null);
  };

  const saveExisting = async () => {
    await onUpdate(editing.id, editing);
    setEditing(null);
  };

  return (
    <div>
      {!editing ? (
        <div>
          <button className="btn btn-primary mb-6" onClick={() => setEditing("new")}>{I.add} New Note</button>
          <div className="grid-3">
            {notes.map(note => {
              const client = getClient(note.clientId);
              return (
                <div key={note.id} className="card" style={{ cursor: "pointer" }} onClick={() => setEditing(note)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <h4 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 16, lineHeight: 1.3 }}>{note.title}</h4>
                  </div>
                  {client && <div style={{ fontSize: 11, color: "var(--gold)", marginBottom: 8 }}>↳ {client.name}</div>}
                  <p style={{ fontSize: 13, color: "var(--slate)", lineHeight: 1.6 }}>{note.body.slice(0, 120)}{note.body.length > 120 ? "…" : ""}</p>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>{fmtDate(note.date)}</div>
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
              <input className="form-control" value={editing === "new" ? newNote.title : editing.title} onChange={event => editing === "new" ? setNewNote(prev => ({ ...prev, title: event.target.value })) : setEditing(prev => ({ ...prev, title: event.target.value }))} placeholder="Note title…" />
            </div>
            <div className="form-group">
              <label className="form-label">Client (optional)</label>
              <select className="form-control" value={editing === "new" ? newNote.clientId : editing.clientId || ""} onChange={event => editing === "new" ? setNewNote(prev => ({ ...prev, clientId: event.target.value ? parseInt(event.target.value) : "" })) : setEditing(prev => ({ ...prev, clientId: event.target.value ? parseInt(event.target.value) : null }))}>
                <option value="">— Select Client —</option>
                {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Note</label>
              <textarea className="form-control" rows={6} value={editing === "new" ? newNote.body : editing.body} onChange={event => editing === "new" ? setNewNote(prev => ({ ...prev, body: event.target.value })) : setEditing(prev => ({ ...prev, body: event.target.value }))} placeholder="Write your note…" />
            </div>
            <button className="btn btn-primary" onClick={editing === "new" ? saveNew : saveExisting}>Save Note</button>
          </div>
        </div>
      )}
    </div>
  );
}
