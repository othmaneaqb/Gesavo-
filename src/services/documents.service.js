import api from "./api";

const getType = (name = "") => name.split(".").pop()?.toLowerCase() || "file";
const API_ORIGIN = api.defaults.baseURL.replace(/\/api\/?$/, "");

export const getDocumentDownloadUrl = (fileUrl = "") => {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  return `${API_ORIGIN}${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
};

const toFrontendDocument = (item) => ({
  id: item.id,
  name: item.title,
  type: getType(item.title),
  size: "—",
  caseId: item.case,
  clientId: item.client,
  date: item.uploaded_at,
  desc: item.description || "",
  fileUrl: item.file,
});

export const documentsService = {
  getAll: async () => (await api.get("documents/")).data.map(toFrontendDocument),
  create: async (data) => {
    const formData = new FormData();
    formData.append("title", data.name);
    formData.append("description", data.desc || "");
    formData.append("client", data.clientId || "");
    formData.append("case", data.caseId || "");
    formData.append("file", data.file);
    return toFrontendDocument((await api.post("documents/", formData)).data);
  },
  update: async (id, data) => {
    const formData = new FormData();
    formData.append("title", data.name);
    formData.append("description", data.desc || "");
    formData.append("client", data.clientId || "");
    formData.append("case", data.caseId || "");
    if (data.file) formData.append("file", data.file);
    return toFrontendDocument((await api.patch(`documents/${id}/`, formData)).data);
  },
  delete: async (id) => {
    await api.delete(`documents/${id}/`);
  },
};
