import { fmtDate, priorityColor } from "@/shared/utils";

export default function TasksPage({ tasks, cases, onMove }) {
  const cols = [
    { id: "todo", label: "To Do" },
    { id: "in-progress", label: "In Progress" },
    { id: "done", label: "Done" },
  ];

  return (
    <div className="kanban">
      {cols.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return (
          <div key={col.id} className="kanban-col">
            <div className="kanban-col-header">
              <span>{col.label}</span>
              <span style={{ background: "var(--border)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{colTasks.length}</span>
            </div>
            {colTasks.map(t => {
              const caseItem = cases.find(c => c.id === t.caseId);
              return (
                <div key={t.id} className="task-card">
                  <div className="task-title">{t.title}</div>
                  <div className="task-meta">
                    <span style={{ color: priorityColor(t.priority), fontWeight: 500 }}>● {t.priority}</span>
                    <span>· {t.assignee}</span>
                    <span>· {fmtDate(t.deadline)}</span>
                  </div>
                  {caseItem && <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted)", background: "var(--cream)", padding: "3px 7px", borderRadius: 4, display: "inline-block" }}>{caseItem.caseNumber}</div>}
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    {col.id !== "todo" && <button className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: 11 }} onClick={() => onMove(t.id, col.id === "in-progress" ? "todo" : "in-progress")}>← Back</button>}
                    {col.id !== "done" && <button className="btn btn-primary btn-sm" style={{ flex: 1, fontSize: 11 }} onClick={() => onMove(t.id, col.id === "todo" ? "in-progress" : "done")}>Forward →</button>}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── NOTES ────────────────────────────────────────────────────────────────────
