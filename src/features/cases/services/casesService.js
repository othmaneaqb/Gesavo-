import api from "@/services/api";

const statusMap = { OPEN: "active", PENDING: "pending", CLOSED: "closed" };
const reverseStatusMap = { active: "OPEN", urgent: "OPEN", pending: "PENDING", closed: "CLOSED" };

export const toFrontendCase = item => ({
  id: item.id,
  caseNumber: item.case_number || "",
  clientId: typeof item.client === "object" ? item.client.id : item.client,
  title: item.title,
  type: item.case_type || "civil",
  court: item.court || "",
  judge: item.judge || "",
  status: statusMap[item.status] || "active",
  openDate: item.created_at,
  hearings: 0,
  nextHearing: item.next_hearing || "",
});

const toBackendCase = item => ({
  title: item.title,
  case_number: item.caseNumber || null,
  case_type: item.type || null,
  court: item.court || null,
  judge: item.judge || null,
  status: reverseStatusMap[item.status] || "OPEN",
  next_hearing: item.nextHearing || null,
  client: item.clientId,
});

export const casesService = {
  getAll: async () => (await api.get("cases/")).data.map(toFrontendCase),
  create: async data => toFrontendCase((await api.post("cases/", toBackendCase(data))).data),
  update: async (id, data) => toFrontendCase((await api.put(`cases/${id}/`, toBackendCase(data))).data),
  delete: async id => (await api.delete(`cases/${id}/`)).data,
};
