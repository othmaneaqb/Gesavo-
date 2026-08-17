import { apiErrorMessage, useApiCollection } from "@/shared/hooks";
import { usersService } from "../services/usersService";

const loadError = apiErrorMessage("Could not load the cabinet team.");

export function useTeam({ enabled }) {
  return useApiCollection({ enabled, load: usersService.getTeam, errorMessage: loadError });
}
