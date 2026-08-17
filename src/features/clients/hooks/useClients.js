import { useCallback, useMemo } from "react";
import { apiErrorMessage, useApiCollection } from "@/shared/hooks";
import { clientsService } from "../services/clientsService";

const loadError = apiErrorMessage("Could not load clients from the backend.");

export function useClients({ enabled, cases, expenses, showToast }) {
  const collection = useApiCollection({
    enabled,
    load: clientsService.getAll,
    errorMessage: loadError,
  });
  const { items, setItems } = collection;

  const clients = useMemo(() => {
    const totals = expenses.reduce((map, item) => {
      const current = map[item.clientId] || { totalFees: 0, paidFees: 0 };
      if (item.type === "invoice") current.totalFees += item.amount;
      if (item.type === "payment") current.paidFees += item.amount;
      map[item.clientId] = current;
      return map;
    }, {});
    const activeCases = cases.reduce((map, item) => {
      if (item.status === "active" || item.status === "urgent") {
        map[item.clientId] = (map[item.clientId] || 0) + 1;
      }
      return map;
    }, {});
    return items.map(client => ({
      ...client,
      ...(totals[client.id] || {}),
      activeCases: activeCases[client.id] || 0,
    }));
  }, [cases, expenses, items]);

  const createClient = useCallback(async data => {
    try {
      const client = await clientsService.create(data);
      setItems(previous => [client, ...previous]);
      showToast("Client added successfully.");
      return true;
    } catch (error) {
      showToast(error?.response?.status === 401
        ? "Please log in before adding clients."
        : "Could not add client.");
      return false;
    }
  }, [setItems, showToast]);

  const updateClient = useCallback(async (id, data) => {
    try {
      const client = await clientsService.update(id, data);
      setItems(previous => previous.map(item => item.id === id ? client : item));
      showToast("Client updated successfully.");
      return true;
    } catch {
      showToast("Could not update client.");
      return false;
    }
  }, [setItems, showToast]);

  const deleteClient = useCallback(async id => {
    if (!window.confirm("Delete this client? This will also remove related backend records.")) return false;
    try {
      await clientsService.delete(id);
      setItems(previous => previous.filter(client => client.id !== id));
      showToast("Client deleted.");
      return true;
    } catch {
      showToast("Could not delete client.");
      return false;
    }
  }, [setItems, showToast]);

  return { ...collection, items: clients, createClient, updateClient, deleteClient };
}
