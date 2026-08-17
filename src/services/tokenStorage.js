export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const AUTH_SESSION_ENDED_EVENT = "gesavo:auth-session-ended";

const browserStorages = () => {
  if (typeof window === "undefined") return [];
  return [window.sessionStorage, window.localStorage];
};

const storageContaining = key => browserStorages().find(storage => storage.getItem(key));

export const getAccessToken = () => (
  storageContaining(ACCESS_TOKEN_KEY)?.getItem(ACCESS_TOKEN_KEY) || null
);

export const getRefreshToken = () => (
  storageContaining(REFRESH_TOKEN_KEY)?.getItem(REFRESH_TOKEN_KEY) || null
);

export const hasStoredSession = () => Boolean(getAccessToken() || getRefreshToken());

export const clearAuthTokens = () => {
  browserStorages().forEach(storage => {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
  });
};

export const storeAuthTokens = ({ access, refresh }, remember = false) => {
  if (!access || !refresh || typeof window === "undefined") {
    throw new Error("Both access and refresh tokens are required.");
  }

  clearAuthTokens();
  const storage = remember ? window.localStorage : window.sessionStorage;
  storage.setItem(ACCESS_TOKEN_KEY, access);
  storage.setItem(REFRESH_TOKEN_KEY, refresh);
};

export const storeRefreshedTokens = ({ access, refresh }) => {
  if (!access) throw new Error("A refreshed access token is required.");

  const storage = storageContaining(REFRESH_TOKEN_KEY);
  if (!storage) throw new Error("No active refresh session exists.");

  storage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) storage.setItem(REFRESH_TOKEN_KEY, refresh);
};

export const terminateAuthSession = (reason = "expired") => {
  const hadSession = hasStoredSession();
  clearAuthTokens();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_SESSION_ENDED_EVENT, {
      detail: { reason, hadSession },
    }));
  }
};
