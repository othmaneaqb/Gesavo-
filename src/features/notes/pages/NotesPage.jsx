import { useState } from "react";
import { useI18n } from "@/i18n";
import { I } from "@/shared/constants";
import { fmtDate } from "@/shared/utils";
import "../notes.css";

export default function NotesPage({ clients, notes, onCreate, onUpdate }) {
  const { t } = useI18n();
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
    <div className="notes-page">
      {!editing ? (
        <div className="notes-list-view">
          <button className="btn btn-primary notes-new-button" onClick={() => setEditing("new")}>{I.add} {t("ui.newNote")}</button>
          <div className="grid-3 notes-grid">
            {notes.map(note => {
              const client = getClient(note.clientId);
              return (
                <div key={note.id} className="card notes-card" onClick={() => setEditing(note)}>
                  <div className="notes-card-header">
                    <h4>{note.title}</h4>
                  </div>
                  {client && <div className="notes-client">↳ {client.name}</div>}
                  <p className="notes-preview">{note.body.slice(0, 120)}{note.body.length > 120 ? "..." : ""}</p>
                  <div className="notes-date">{fmtDate(note.date)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="notes-editor">
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => setEditing(null)}>{I.back} {t("ui.back")}</button>
          <div className="card">
            <div className="form-group">
              <label className="form-label">{t("ui.title")}</label>
              <input className="form-control" value={editing === "new" ? newNote.title : editing.title} onChange={event => editing === "new" ? setNewNote(prev => ({ ...prev, title: event.target.value })) : setEditing(prev => ({ ...prev, title: event.target.value }))} placeholder={t("ui.title")} />
            </div>
            <div className="form-group">
              <label className="form-label">{t("ui.clientOptional")}</label>
              <select className="form-control" value={editing === "new" ? newNote.clientId : editing.clientId || ""} onChange={event => editing === "new" ? setNewNote(prev => ({ ...prev, clientId: event.target.value ? parseInt(event.target.value) : "" })) : setEditing(prev => ({ ...prev, clientId: event.target.value ? parseInt(event.target.value) : null }))}>
                <option value="">- {t("ui.selectClient")} -</option>
                {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t("ui.note")}</label>
              <textarea className="form-control" rows={6} value={editing === "new" ? newNote.body : editing.body} onChange={event => editing === "new" ? setNewNote(prev => ({ ...prev, body: event.target.value })) : setEditing(prev => ({ ...prev, body: event.target.value }))} placeholder={t("ui.writeNote")} />
            </div>
            <button className="btn btn-primary" onClick={editing === "new" ? saveNew : saveExisting}>{t("ui.saveNote")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
