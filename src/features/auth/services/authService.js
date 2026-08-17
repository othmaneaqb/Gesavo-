import api from "@/services/api";
import {
  clearAuthTokens,
  getRefreshToken,
  hasStoredSession,
  storeAuthTokens,
} from "@/services/tokenStorage";

export const authService = {
  login: async (username, password, remember = false) => {
    clearAuthTokens();
    const response = await api.post(
      "users/login/",
      { username, password },
      { skipAuth: true, skipAuthRefresh: true },
    );
    storeAuthTokens(response.data, remember);
    return response.data;
  },

  logout: async () => {
    const refresh = getRefreshToken();
    clearAuthTokens();
    if (!refresh) return;

    try {
      await api.post(
        "users/logout/",
        { refresh },
        { skipAuth: true, skipAuthRefresh: true },
      );
    } catch {
      // Local termination must succeed even if the server is unreachable.
    }
  },

  clearLocalSession: clearAuthTokens,
  hasSession: hasStoredSession,
  getProfile: async () => (await api.get("users/profile/")).data,
  requestPasswordReset: async email => (
    await api.post(
      "users/password-reset/",
      { email },
      { skipAuth: true, skipAuthRefresh: true },
    )
  ).data,
  confirmPasswordReset: async ({ uid, token, password, passwordConfirm }) => (
    await api.post(
      "users/password-reset/confirm/",
      { uid, token, password, password_confirm: passwordConfirm },
      { skipAuth: true, skipAuthRefresh: true },
    )
  ).data,
};
