// src/lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // important so browser sends cookies (refresh token)
});

// Request interceptor attaches access token from localStorage (or in-memory store)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // you can keep it in memory for better security
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
let isRefreshing = false;
let failedQueue: { resolve: (arg0: string | null) => void; reject: (arg0?: unknown) => void }[] = [];

const processQueue = (error: unknown | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};


api.interceptors.response.use(
  (response) => response,
  async (err) => {
    const originalRequest = err.config;

    if (
  (err.response?.status === 401 || err.response?.status === 403) &&
  !originalRequest._retry &&
  !originalRequest.url?.includes("/login") // <- exclude login
)  {
      if (isRefreshing) {
        // Wait for the current refresh to finish
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("🔄 Refreshing token...");
        const refreshRes = await api.post("/api/users/refresh-token"); // cookie sent automatically
        const newAccessToken = refreshRes.data.accessToken;
        localStorage.setItem("token", newAccessToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return api(originalRequest); // retry original request
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem("token");
        localStorage.removeItem("User");
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);


export default api;
