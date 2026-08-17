import { useCallback } from "react";
import { apiErrorMessage, useApiCollection } from "@/shared/hooks";
import { notesService } from "../services/notesService";

const loadError = apiErrorMessage("Could not load notes from the backend.");

export function useNotes({ enabled, showToast }) {
  const collection = useApiCollection({ enabled, load: notesService.getAll, errorMessage: loadError });
  const { setItems } = collection;

  const createNote = useCallback(async data => {
    try {
      const note = await notesService.create(data);
      setItems(previous => [note, ...previous]);
      return note;
    } catch {
      showToast("Could not create note.");
      return null;
    }
  }, [setItems, showToast]);

  const updateNote = useCallback(async (id, data) => {
    try {
      const note = await notesService.update(id, data);
      setItems(previous => previous.map(item => item.id === id ? note : item));
      return note;
    } catch {
      showToast("Could not update note.");
      return null;
    }
  }, [setItems, showToast]);

  return { ...collection, createNote, updateNote };
}
