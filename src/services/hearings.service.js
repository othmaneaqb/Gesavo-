import api from "./api";

export const toFrontendHearing = (item) => {
  const start = new Date(item.start_time);
  return {
    id: item.id,
    caseId: item.case,
    title: item.title,
    date: item.start_time?.slice(0, 10),
    time: start.toTimeString().slice(0, 5),
    court: item.court || "",
    status: item.status === "COMPLETED" ? "completed" : "upcoming",
    outcome: item.outcome || "",
  };
};

const toBackendHearing = (item) => {
  const start = `${item.date}T${item.time || "09:00"}:00`;
  const endDate = new Date(start);
  endDate.setHours(endDate.getHours() + 1);
  return {
    title: item.title,
    description: null,
    court: item.court || null,
    outcome: item.outcome || null,
    status: item.status === "completed" ? "COMPLETED" : "UPCOMING",
    start_time: start,
    end_time: endDate.toISOString(),
    case: item.caseId || null,
    attendees: [],
  };
};

export const hearingsService = {
  getAll: async () => (await api.get("events/")).data.map(toFrontendHearing),
  create: async (data) => toFrontendHearing((await api.post("events/", toBackendHearing({ ...data, status: "upcoming" }))).data),
};
