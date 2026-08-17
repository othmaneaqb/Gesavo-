import { useMemo } from "react";

export function useDashboardInsights({ documents, notes, expenses }) {
  return useMemo(() => [
    ...documents.slice(0, 2).map(document => ({
      id: `doc-${document.id}`,
      clientId: document.clientId,
      text: `Document uploaded: ${document.name}`,
      time: "Recent",
      type: "doc",
    })),
    ...notes.slice(0, 2).map(note => ({
      id: `note-${note.id}`,
      clientId: note.clientId,
      text: `Note added: ${note.title}`,
      time: "Recent",
      type: "note",
    })),
    ...expenses.slice(0, 2).map(item => ({
      id: `finance-${item.id}`,
      clientId: item.clientId,
      text: `${item.type === "payment" ? "Payment received" : "Transaction recorded"}: ${item.description}`,
      time: "Recent",
      type: item.type,
    })),
  ].slice(0, 5), [documents, expenses, notes]);
}
