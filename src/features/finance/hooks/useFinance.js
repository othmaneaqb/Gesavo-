import { useCallback } from "react";
import { apiErrorMessage, useApiCollection } from "@/shared/hooks";
import { financeService } from "../services/financeService";

const loadError = apiErrorMessage("Could not load Finance from the backend.");

export function useFinance({ enabled, showToast }) {
  const collection = useApiCollection({ enabled, load: financeService.getAll, errorMessage: loadError });
  const { setItems } = collection;

  const createTransaction = useCallback(async data => {
    try {
      const transaction = await financeService.create(data);
      setItems(previous => [transaction, ...previous]);
      showToast("Transaction recorded.");
      return true;
    } catch {
      showToast("Could not record transaction.");
      return false;
    }
  }, [setItems, showToast]);

  return { ...collection, createTransaction };
}
