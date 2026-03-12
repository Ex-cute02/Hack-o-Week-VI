import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// These will be set by the AuthContext
let getAccessToken: () => string | null = () => null;
let refreshFn: () => Promise<string | null> = async () => null;
let logoutFn: () => void = () => {};

export function configureInterceptors(
  tokenGetter: () => string | null,
  refresh: () => Promise<string | null>,
  logout: () => void,
) {
  getAccessToken = tokenGetter;
  refreshFn = refresh;
  logoutFn = logout;
}

// Request interceptor: attach access token
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 with silent refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh or logout requests
      if (
        originalRequest.url?.includes("/auth/refresh") ||
        originalRequest.url?.includes("/auth/logout")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshFn();
        if (!newToken) {
          processQueue(new Error("Refresh failed"));
          logoutFn();
          return Promise.reject(error);
        }
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        logoutFn();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export { apiClient };
