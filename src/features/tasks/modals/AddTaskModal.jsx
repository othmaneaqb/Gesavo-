import { useState } from "react";
import { Modal } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";

export default function AddTaskModal({
  onClose,
  onSave,
  cases,
  initialValues = null,
  title = "Create Task",
  saveLabel = "Create Task",
}) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    title: initialValues?.title || "",
    assignee: initialValues?.assignee || "",
    priority: initialValues?.priority || "normal",
    deadline: initialValues?.deadline || "",
    caseId: initialValues?.caseId || "",
    status: initialValues?.status || "todo",
  });

  const set = key => event => setForm(prev => ({ ...prev, [key]: event.target.value }));

  const save = async () => {
    if (!form.title) return;
    const saved = await onSave({
      ...form,
      caseId: form.caseId ? parseInt(form.caseId) : null,
    });
    if (saved !== false) onClose();
  };

  const assigneeOptions = [
    ["Lead Attorney", t("forms.leadAttorney")],
    ["Associate", t("forms.associate")],
    ["Secretary", t("forms.secretary")],
    ["Paralegal", t("forms.paralegal")],
  ];

  const titleText = title === "Edit Task" ? t("forms.editTask") : t("forms.createTask");
  const saveText = saveLabel === "Save Changes" ? t("forms.saveChanges") : t("forms.createTaskSave");

  return (
    <Modal title={titleText} onClose={onClose} onSave={save} saveLabel={saveText}>
      <div className="form-group">
        <label className="form-label">{t("forms.taskTitle")} *</label>
        <input
          className="form-control"
          value={form.title}
          onChange={set("title")}
          placeholder={t("forms.taskPlaceholder")}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t("forms.assignee")}</label>
          <select className="form-control" value={form.assignee} onChange={set("assignee")}>
            <option value="">— {t("forms.assignTo")} —</option>
            {assigneeOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{t("forms.priority")}</label>
          <select className="form-control" value={form.priority} onChange={set("priority")}>
            {["urgent", "high", "normal", "low"].map(priority => (
              <option key={priority} value={priority}>{t(`status.${priority}`)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t("forms.deadline")}</label>
          <input type="date" className="form-control" value={form.deadline} onChange={set("deadline")} />
        </div>

        <div className="form-group">
          <label className="form-label">{t("forms.linkedCase")}</label>
          <select className="form-control" value={form.caseId} onChange={set("caseId")}>
            <option value="">— {t("forms.optional")} —</option>
            {cases.map(caseItem => (
              <option key={caseItem.id} value={caseItem.id}>{caseItem.caseNumber}</option>
            ))}
          </select>
        </div>
      </div>

      {initialValues && (
        <div className="form-group">
          <label className="form-label">{t("ui.status")}</label>
          <select className="form-control" value={form.status} onChange={set("status")}>
            <option value="todo">{t("status.todo")}</option>
            <option value="in-progress">{t("status.in-progress")}</option>
            <option value="done">{t("status.done")}</option>
          </select>
        </div>
      )}
    </Modal>
  );
}
