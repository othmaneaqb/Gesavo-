import api from "./api";

const toFrontendTransaction = (item) => ({
  id: item.id,
  clientId: item.client,
  caseId: item.case,
  description: item.description,
  amount: Number(item.amount),
  date: item.date,
  type: item.type,
  status: item.status,
});

const toBackendTransaction = (item) => ({
  client: item.clientId,
  case: item.caseId || null,
  description: item.description,
  amount: item.amount,
  date: item.date,
  type: item.type,
  status: item.status || null,
});

export const financeService = {
  getAll: async () => (await api.get("finance/transactions/")).data.map(toFrontendTransaction),
  create: async (data) => toFrontendTransaction((await api.post("finance/transactions/", toBackendTransaction(data))).data),
};
