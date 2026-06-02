import { useState } from "react";
import { useI18n } from "@/i18n";
import { I } from "@/shared/constants";
import { fmtDate } from "@/shared/utils";

export default function NotesPage({ clients, notes, onCreate, onUpdate, onDelete }) {
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

  const deleteExisting = async () => {
    if (!editing || editing === "new") return;
    const deleted = await onDelete(editing.id);
    if (deleted !== false) setEditing(null);
  };

  return (
    <div>
      {!editing ? (
        <div>
          <button className="btn btn-primary mb-6" onClick={() => setEditing("new")}>{I.add} {t("ui.newNote")}</button>
          <div className="grid-3">
            {notes.map(note => {
              const client = getClient(note.clientId);
              return (
                <div key={note.id} className="card" style={{ cursor: "pointer" }} onClick={() => setEditing(note)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <h4 style={{ fontFamily: "var(--font-heading)", fontSize: 16, lineHeight: 1.3 }}>{note.title}</h4>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ fontSize: 10, padding: "3px 7px" }}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(note.id);
                      }}
                    >
                      {t("ui.delete")}
                    </button>
                  </div>
                  {client && <div style={{ fontSize: 11, color: "var(--gold)", marginBottom: 8 }}>↳ {client.name}</div>}
                  <p style={{ fontSize: 13, color: "var(--slate)", lineHeight: 1.6 }}>{note.body.slice(0, 120)}{note.body.length > 120 ? "..." : ""}</p>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>{fmtDate(note.date)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 640 }}>
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
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={editing === "new" ? saveNew : saveExisting}>{t("ui.saveNote")}</button>
              {editing !== "new" && <button className="btn btn-danger" onClick={deleteExisting}>{t("ui.delete")}</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
