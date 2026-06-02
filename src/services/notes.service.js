import api from "./api";

const toFrontendNote = (item) => ({
  id: item.id,
  title: item.title || "",
  body: item.content,
  clientId: item.client,
  caseId: item.case,
  date: item.created_at,
});

const toBackendNote = (item) => ({
  title: item.title || null,
  content: item.body,
  client: item.clientId || null,
  case: item.caseId || null,
});

export const notesService = {
  getAll: async () => (await api.get("notes/")).data.map(toFrontendNote),
  create: async (data) => toFrontendNote((await api.post("notes/", toBackendNote(data))).data),
  update: async (id, data) => toFrontendNote((await api.put(`notes/${id}/`, toBackendNote(data))).data),
  delete: async (id) => api.delete(`notes/${id}/`),
};
