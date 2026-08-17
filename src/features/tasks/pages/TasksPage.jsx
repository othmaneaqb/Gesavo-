import { useState } from "react";
import { FilterPanel } from "@/components/ui";
import { useI18n } from "@/i18n";
import { fmtDate, priorityColor } from "@/shared/utils";
import "../tasks.css";

export default function TasksPage({ tasks, cases, onMove, onRestore }) {
  const { t } = useI18n();
  const [view, setView] = useState("active");
  const [caseFilter, setCaseFilter] = useState("all");
  const cols = [
    { id: "todo", label: t("status.todo") },
    { id: "in-progress", label: t("status.in-progress") },
    { id: "done", label: t("status.done") },
  ];

  const filteredTasks = tasks.filter(task =>
    (caseFilter === "all" || task.caseId === Number(caseFilter)) &&
    (view === "archive" ? task.isArchived : !task.isArchived)
  );

  return (
    <div className="tasks-page">
      <FilterPanel
        title={t("ui.filters")}
        clearLabel={t("ui.clearFilters")}
        canClear={view !== "active" || caseFilter !== "all"}
        onClear={() => { setView("active"); setCaseFilter("all"); }}
      >
        <div className="filter-field filter-field-view">
          <label>{t("ui.view")}</label>
          <div className="filter-segmented">
          <button className={`btn ${view === "active" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("active")}>{t("ui.activeTasks")}</button>
          <button className={`btn ${view === "archive" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("archive")}>{t("ui.archive")}</button>
          </div>
        </div>
        <div className="filter-field filter-field-wide">
          <label>{t("ui.case")}</label>
          <select className="form-control" value={caseFilter} onChange={event => setCaseFilter(event.target.value)}>
            <option value="all">{t("ui.allCases")}</option>
            {cases.map(caseItem => <option key={caseItem.id} value={caseItem.id}>{caseItem.caseNumber} - {caseItem.title}</option>)}
          </select>
        </div>
      </FilterPanel>

      {view === "active" ? (
        <div className="kanban">
          {cols.map(col => {
            const colTasks = filteredTasks.filter(task => task.status === col.id);
            return (
              <div key={col.id} className="kanban-col">
                <div className="kanban-col-header">
                  <span>{col.label}</span>
                  <span className="tasks-column-count">{colTasks.length}</span>
                </div>
                {colTasks.map(task => {
                  const caseItem = cases.find(item => item.id === task.caseId);
                  return (
                    <div key={task.id} className="task-card">
                      <div className="task-title">{task.title}</div>
                      <div className="task-meta">
                        <span style={{ color: priorityColor(task.priority), fontWeight: 500 }}>● {t(`status.${task.priority}`, task.priority)}</span>
                        {task.assignee && <span>· {task.assignee}</span>}
                        <span>· {fmtDate(task.deadline)}</span>
                      </div>
                      {caseItem && <div className="tasks-case-reference">{caseItem.caseNumber}</div>}
                      <div className="tasks-card-actions">
                        {col.id !== "todo" && <button className="btn btn-ghost btn-sm" onClick={() => onMove(task.id, col.id === "in-progress" ? "todo" : "in-progress")}>← {t("ui.back")}</button>}
                        {col.id !== "done" && <button className="btn btn-primary btn-sm" onClick={() => onMove(task.id, col.id === "todo" ? "in-progress" : "done")}>{t("ui.forward")} →</button>}
                      </div>
                    </div>
                  );
                })}
                {colTasks.length === 0 && <div className="empty-state"><h3>{t("ui.noTasks")}</h3></div>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card tasks-archive-card">
          {filteredTasks.map(task => {
            const caseItem = cases.find(item => item.id === task.caseId);
            return (
              <div key={task.id} className="tasks-archive-row">
                <div>
                  <div className="tasks-archive-title">{task.title}</div>
                  <div className="tasks-archive-meta">
                    {caseItem?.caseNumber || t("ui.noLinkedCase")} · {t("ui.archived")} {fmtDate(task.archivedAt)}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => onRestore(task.id)}>{t("ui.restore")}</button>
              </div>
            );
          })}
          {filteredTasks.length === 0 && <div className="empty-state"><h3>{t("ui.noArchivedTasks")}</h3></div>}
        </div>
      )}
    </div>
  );
}
