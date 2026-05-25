import api from "./api";

const getType = (name = "") => name.split(".").pop()?.toLowerCase() || "file";

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
    if (data.clientId) formData.append("client", data.clientId);
    if (data.caseId) formData.append("case", data.caseId);
    formData.append("file", data.file);
    return toFrontendDocument((await api.post("documents/", formData)).data);
  },
};
