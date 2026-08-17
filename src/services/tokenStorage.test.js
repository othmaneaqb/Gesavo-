import {
  ACCESS_TOKEN_KEY,
  AUTH_SESSION_ENDED_EVENT,
  REFRESH_TOKEN_KEY,
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  storeAuthTokens,
  storeRefreshedTokens,
  terminateAuthSession,
} from "./tokenStorage";

describe("tokenStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  test("stores a default login only for the browser session", () => {
    storeAuthTokens({ access: "access-1", refresh: "refresh-1" });

    expect(window.sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBe("access-1");
    expect(window.sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBe("refresh-1");
    expect(window.localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
  });

  test("Remember me persists both tokens in local storage", () => {
    storeAuthTokens({ access: "access-1", refresh: "refresh-1" }, true);

    expect(window.localStorage.getItem(ACCESS_TOKEN_KEY)).toBe("access-1");
    expect(window.localStorage.getItem(REFRESH_TOKEN_KEY)).toBe("refresh-1");
    expect(window.sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
  });

  test("rotation replaces tokens in their original storage", () => {
    storeAuthTokens({ access: "access-1", refresh: "refresh-1" });
    storeRefreshedTokens({ access: "access-2", refresh: "refresh-2" });

    expect(getAccessToken()).toBe("access-2");
    expect(getRefreshToken()).toBe("refresh-2");
    expect(window.localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });

  test("session termination clears tokens and emits one event", () => {
    const listener = jest.fn();
    window.addEventListener(AUTH_SESSION_ENDED_EVENT, listener);
    storeAuthTokens({ access: "access-1", refresh: "refresh-1" }, true);

    terminateAuthSession("expired");

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail.reason).toBe("expired");
    window.removeEventListener(AUTH_SESSION_ENDED_EVENT, listener);
  });

  afterEach(clearAuthTokens);
});
