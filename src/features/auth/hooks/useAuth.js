import { useCallback, useEffect, useState } from "react";
import { AUTH_SESSION_ENDED_EVENT } from "@/services/tokenStorage";
import { authService } from "../services/authService";

const initialState = { loading: true, user: null, error: null };

export function useAuth() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    const handleSessionEnded = () => {
      setState({ loading: false, user: null, error: "auth.sessionExpired" });
    };
    window.addEventListener(AUTH_SESSION_ENDED_EVENT, handleSessionEnded);
    return () => window.removeEventListener(AUTH_SESSION_ENDED_EVENT, handleSessionEnded);
  }, []);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      if (!authService.hasSession()) {
        if (active) setState({ loading: false, user: null, error: null });
        return;
      }
      try {
        const user = await authService.getProfile();
        if (active) setState({ loading: false, user, error: null });
      } catch {
        if (!active) return;
        setState({
          loading: false,
          user: null,
          error: authService.hasSession()
            ? "auth.sessionUnavailable"
            : "auth.sessionExpired",
        });
      }
    };

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (username, password, remember) => {
    try {
      setState(previous => ({ ...previous, error: null }));
      await authService.login(username, password, remember);
      const user = await authService.getProfile();
      setState({ loading: false, user, error: null });
      return true;
    } catch {
      setState({ loading: false, user: null, error: "auth.invalidCredentials" });
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    const request = authService.logout();
    setState({ loading: false, user: null, error: null });
    await request;
  }, []);

  return { ...state, login, logout };
}
