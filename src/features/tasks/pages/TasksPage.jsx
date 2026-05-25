import { useState } from "react";
import { fmtDate, priorityColor } from "@/shared/utils";

export default function TasksPage({ tasks, cases, onMove, onRestore }) {
  const [view, setView] = useState("active");
  const [caseFilter, setCaseFilter] = useState("all");
  const cols = [
    { id: "todo", label: "To Do" },
    { id: "in-progress", label: "In Progress" },
    { id: "done", label: "Done" },
  ];

  const filteredTasks = tasks.filter(task =>
    (caseFilter === "all" || task.caseId === Number(caseFilter)) &&
    (view === "archive" ? task.isArchived : !task.isArchived)
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button className={`btn ${view === "active" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("active")}>Active Tasks</button>
          <button className={`btn ${view === "archive" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("archive")}>Archive</button>
        </div>
        <select className="form-control" style={{ maxWidth: 240 }} value={caseFilter} onChange={event => setCaseFilter(event.target.value)}>
          <option value="all">All cases</option>
          {cases.map(caseItem => <option key={caseItem.id} value={caseItem.id}>{caseItem.caseNumber} — {caseItem.title}</option>)}
        </select>
      </div>

      {view === "active" ? (
        <div className="kanban">
          {cols.map(col => {
            const colTasks = filteredTasks.filter(task => task.status === col.id);
            return (
              <div key={col.id} className="kanban-col">
                <div className="kanban-col-header">
                  <span>{col.label}</span>
                  <span style={{ background: "var(--border)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{colTasks.length}</span>
                </div>
                {colTasks.map(task => {
                  const caseItem = cases.find(item => item.id === task.caseId);
                  return (
                    <div key={task.id} className="task-card">
                      <div className="task-title">{task.title}</div>
                      <div className="task-meta">
                        <span style={{ color: priorityColor(task.priority), fontWeight: 500 }}>● {task.priority}</span>
                        {task.assignee && <span>· {task.assignee}</span>}
                        <span>· {fmtDate(task.deadline)}</span>
                      </div>
                      {caseItem && <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted)", background: "var(--cream)", padding: "3px 7px", borderRadius: 4, display: "inline-block" }}>{caseItem.caseNumber}</div>}
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        {col.id !== "todo" && <button className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: 11 }} onClick={() => onMove(task.id, col.id === "in-progress" ? "todo" : "in-progress")}>← Back</button>}
                        {col.id !== "done" && <button className="btn btn-primary btn-sm" style={{ flex: 1, fontSize: 11 }} onClick={() => onMove(task.id, col.id === "todo" ? "in-progress" : "done")}>Forward →</button>}
                      </div>
                    </div>
                  );
                })}
                {colTasks.length === 0 && <div className="empty-state"><h3>No tasks</h3></div>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          {filteredTasks.map(task => {
            const caseItem = cases.find(item => item.id === task.caseId);
            return (
              <div key={task.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{task.title}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                    {caseItem?.caseNumber || "No linked case"} · archived {fmtDate(task.archivedAt)}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => onRestore(task.id)}>Restore</button>
              </div>
            );
          })}
          {filteredTasks.length === 0 && <div className="empty-state"><h3>No archived tasks</h3></div>}
        </div>
      )}
    </div>
  );
}
