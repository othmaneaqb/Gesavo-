import api from "./api";

const statusMap = { PENDING: "todo", IN_PROGRESS: "in-progress", COMPLETED: "done" };
const reverseStatusMap = { todo: "PENDING", "in-progress": "IN_PROGRESS", done: "COMPLETED" };

export const toFrontendTask = (item) => ({
  id: item.id,
  title: item.title,
  assignee: item.assigned_to?.username || "",
  priority: item.priority || "normal",
  deadline: item.due_date || "",
  status: statusMap[item.status] || "todo",
  caseId: item.case,
  completedAt: item.completed_at,
  archivedAt: item.archived_at,
  isArchived: item.is_archived,
});

const toBackendTask = (item) => ({
  title: item.title,
  description: item.description || null,
  priority: item.priority || null,
  due_date: item.deadline || null,
  status: reverseStatusMap[item.status] || "PENDING",
  case: item.caseId || null,
  assigned_to: null,
});

export const tasksService = {
  getAll: async () => (await api.get("tasks/")).data.map(toFrontendTask),
  create: async (data) => toFrontendTask((await api.post("tasks/", toBackendTask({ ...data, status: "todo" }))).data),
  update: async (id, data) => toFrontendTask((await api.patch(`tasks/${id}/`, toBackendTask(data))).data),
  updateStatus: async (id, status) => toFrontendTask((await api.patch(`tasks/${id}/`, { status: reverseStatusMap[status] })).data),
  restore: async (id) => toFrontendTask((await api.post(`tasks/${id}/restore/`)).data),
  delete: async (id) => api.delete(`tasks/${id}/`),
};
