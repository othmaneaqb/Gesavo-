import { useCallback } from "react";
import { apiErrorMessage, useApiCollection } from "@/shared/hooks";
import { hearingsService } from "../services/hearingsService";

const loadError = apiErrorMessage("Could not load hearings from the backend.");

export function useHearings({ enabled, showToast }) {
  const collection = useApiCollection({ enabled, load: hearingsService.getAll, errorMessage: loadError });
  const { setItems } = collection;

  const createHearing = useCallback(async data => {
    try {
      const hearing = await hearingsService.create(data);
      setItems(previous => [hearing, ...previous]);
      showToast("Hearing scheduled.");
      return true;
    } catch {
      showToast("Could not schedule hearing.");
      return false;
    }
  }, [setItems, showToast]);

  return { ...collection, createHearing };
}
