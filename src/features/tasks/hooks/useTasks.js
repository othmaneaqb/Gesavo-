import { useCallback } from "react";
import { apiErrorMessage, useApiCollection } from "@/shared/hooks";
import { tasksService } from "../services/tasksService";

const loadError = apiErrorMessage("Could not load tasks from the backend.");

export function useTasks({ enabled, showToast }) {
  const collection = useApiCollection({ enabled, load: tasksService.getAll, errorMessage: loadError });
  const { setItems } = collection;

  const createTask = useCallback(async data => {
    try {
      const task = await tasksService.create(data);
      setItems(previous => [task, ...previous]);
      showToast("Task created.");
      return true;
    } catch {
      showToast("Could not create task.");
      return false;
    }
  }, [setItems, showToast]);

  const moveTask = useCallback(async (id, status) => {
    try {
      const task = await tasksService.updateStatus(id, status);
      setItems(previous => previous.map(item => item.id === id ? task : item));
    } catch {
      showToast("Could not update task.");
    }
  }, [setItems, showToast]);

  const restoreTask = useCallback(async id => {
    try {
      const task = await tasksService.restore(id);
      setItems(previous => previous.map(item => item.id === id ? task : item));
      showToast("Task restored.");
    } catch {
      showToast("Could not restore task.");
    }
  }, [setItems, showToast]);

  return { ...collection, createTask, moveTask, restoreTask };
}
