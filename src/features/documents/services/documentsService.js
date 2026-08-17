import api from "@/services/api";

const getType = (name = "") => name.split(".").pop()?.toLowerCase() || "file";

export const formatBytes = bytes => {
  if (!Number.isFinite(Number(bytes))) return "—";
  const value = Number(bytes);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

export const toFrontendDocument = item => ({
  id: item.id,
  name: item.title,
  originalName: item.original_filename || item.title,
  type: getType(item.original_filename || item.title),
  mimeType: item.mime_type,
  size: formatBytes(item.size),
  sha256: item.sha256,
  caseId: item.case,
  clientId: item.client,
  date: item.uploaded_at,
  desc: item.description || "",
  fileUrl: item.download_url,
});

export const documentsService = {
  getAll: async () => (await api.get("documents/")).data.map(toFrontendDocument),
  create: async data => {
    const formData = new FormData();
    formData.append("title", data.name);
    formData.append("description", data.desc || "");
    if (data.clientId) formData.append("client", data.clientId);
    if (data.caseId) formData.append("case", data.caseId);
    formData.append("file", data.file);
    return toFrontendDocument((await api.post("documents/", formData)).data);
  },
  download: async document => {
    if (!document.fileUrl) throw new Error("This document has no protected download URL.");
    const response = await api.get(document.fileUrl, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = document.originalName || document.name;
    anchor.style.display = "none";
    window.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  },
};
