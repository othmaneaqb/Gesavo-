import api from "@/services/api";

const toFrontendTransaction = item => ({
  id: item.id,
  clientId: item.client,
  caseId: item.case,
  description: item.description,
  amount: Number(item.amount),
  date: item.date,
  type: item.type,
  status: item.status,
  invoiceNumber: item.invoice_number || null,
});

const toBackendTransaction = item => ({
  client: item.clientId,
  case: item.caseId || null,
  description: item.description,
  amount: item.amount,
  date: item.date,
  type: item.type,
  status: item.type === "payment" ? "paid" : item.type === "expense" ? null : item.status || "outstanding",
});

export const financeService = {
  getAll: async () => (await api.get("finance/transactions/")).data.map(toFrontendTransaction),
  create: async data => toFrontendTransaction((await api.post("finance/transactions/", toBackendTransaction(data))).data),
};
