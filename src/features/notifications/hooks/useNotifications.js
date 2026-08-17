import { useMemo } from "react";

export function useNotifications({ user, tasks, hearings, documents, cases }) {
  return useMemo(() => {
    if (!user) return [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inSevenDays = new Date(startOfToday);
    inSevenDays.setDate(inSevenDays.getDate() + 7);
    const toDate = value => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const taskAlerts = tasks.map(task => {
      if (task.isArchived || task.status === "done" || !task.deadline) return null;
      const deadline = toDate(task.deadline);
      if (!deadline) return null;
      const caseItem = cases.find(item => item.id === task.caseId);
      const isOverdue = deadline < startOfToday;
      const isDueSoon = deadline <= inSevenDays;
      if (!isOverdue && !isDueSoon && task.priority !== "urgent") return null;
      return {
        id: `task-${task.id}`,
        type: isOverdue ? "danger" : task.priority === "urgent" ? "warning" : "info",
        title: isOverdue ? "Tâche en retard" : task.priority === "urgent" ? "Tâche urgente" : "Tâche proche",
        message: `${task.title}${caseItem ? ` · ${caseItem.caseNumber}` : ""}`,
        date: task.deadline,
        page: "tasks",
      };
    }).filter(Boolean);

    const hearingAlerts = hearings.map(hearing => {
      if (hearing.status !== "upcoming") return null;
      const date = toDate(hearing.date);
      if (!date || date < startOfToday || date > inSevenDays) return null;
      const caseItem = cases.find(item => item.id === hearing.caseId);
      return {
        id: `hearing-${hearing.id}`,
        type: "gold",
        title: "Audience à venir",
        message: `${hearing.title}${caseItem ? ` · ${caseItem.caseNumber}` : ""}`,
        date: hearing.date,
        page: "calendar",
      };
    }).filter(Boolean);

    const documentAlerts = documents.filter(document => {
      const uploadedAt = toDate(document.date);
      if (!uploadedAt) return false;
      const age = now - uploadedAt;
      return age >= 0 && age <= 1000 * 60 * 60 * 24 * 3;
    }).slice(0, 4).map(document => ({
      id: `doc-${document.id}`,
      type: "info",
      title: "Document récent",
      message: document.name,
      date: document.date,
      page: "documents",
    }));

    return [...taskAlerts, ...hearingAlerts, ...documentAlerts]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 12);
  }, [cases, documents, hearings, tasks, user]);
}
