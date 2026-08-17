import { useCallback } from "react";
import { apiErrorMessage, useApiCollection } from "@/shared/hooks";
import { casesService } from "../services/casesService";

const loadError = apiErrorMessage("Could not load cases from the backend.");

export function useCases({ enabled, showToast }) {
  const collection = useApiCollection({ enabled, load: casesService.getAll, errorMessage: loadError });
  const { setItems } = collection;

  const createCase = useCallback(async data => {
    try {
      const item = await casesService.create(data);
      setItems(previous => [item, ...previous]);
      showToast("Case opened successfully.");
      return true;
    } catch {
      showToast("Could not open case.");
      return false;
    }
  }, [setItems, showToast]);

  const updateCase = useCallback(async (id, data) => {
    try {
      const item = await casesService.update(id, data);
      setItems(previous => previous.map(current => current.id === id ? item : current));
      showToast("Case updated successfully.");
      return true;
    } catch {
      showToast("Could not update case.");
      return false;
    }
  }, [setItems, showToast]);

  const deleteCase = useCallback(async id => {
    if (!window.confirm("Delete this case? This will also remove related backend records.")) return false;
    try {
      await casesService.delete(id);
      setItems(previous => previous.filter(item => item.id !== id));
      showToast("Case deleted.");
      return true;
    } catch {
      showToast("Could not delete case.");
      return false;
    }
  }, [setItems, showToast]);

  return { ...collection, createCase, updateCase, deleteCase };
}
