import axios from "axios";
import { createRefreshQueue } from "./refreshQueue";
import {
  getAccessToken,
  getRefreshToken,
  hasStoredSession,
  storeRefreshedTokens,
  terminateAuthSession,
} from "./tokenStorage";

// Production defaults to a same-origin API. Local and split-domain deployments
// can override it through the Create React App environment contract.
export const API_BASE_URL = (process.env.REACT_APP_API_URL || "/api/").replace(/\/?$/, "/");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Refresh calls use a separate client so a rejected refresh never recursively
// enters the authenticated response interceptor.
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

const requestFreshAccessToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("No refresh token is available.");

  const response = await refreshClient.post("users/login/refresh/", { refresh });
  storeRefreshedTokens(response.data);
  return response.data.access;
};

// Every request arriving during one refresh awaits the same promise. Rotation
// therefore occurs once and all queued requests receive the same new access.
const enqueueRefresh = createRefreshQueue(
  requestFreshAccessToken,
  () => terminateAuthSession("expired"),
);

api.interceptors.request.use(
  config => {
    if (!config.skipAuth) {
      const access = getAccessToken();
      if (access) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${access}`;
      }
    }
    return config;
  },
  error => Promise.reject(error),
);

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config || {};
    if (error.response?.status !== 401 || originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    if (originalRequest._jwtRetry) {
      terminateAuthSession("expired");
      return Promise.reject(error);
    }

    const refresh = getRefreshToken();
    if (!refresh) {
      if (hasStoredSession()) terminateAuthSession("expired");
      return Promise.reject(error);
    }

    originalRequest._jwtRetry = true;

    try {
      const access = await enqueueRefresh();
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${access}`;
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export default api;
