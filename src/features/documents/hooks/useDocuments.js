import { useCallback } from "react";
import { apiErrorMessage, useApiCollection } from "@/shared/hooks";
import { documentsService } from "../services/documentsService";

const loadError = apiErrorMessage("Could not load documents from the backend.");

export function useDocuments({ enabled, showToast }) {
  const collection = useApiCollection({ enabled, load: documentsService.getAll, errorMessage: loadError });
  const { setItems } = collection;

  const createDocument = useCallback(async data => {
    try {
      const document = await documentsService.create(data);
      setItems(previous => [document, ...previous]);
      showToast("Document uploaded.");
      return true;
    } catch {
      showToast("Could not upload document.");
      return false;
    }
  }, [setItems, showToast]);

  return { ...collection, createDocument };
}
