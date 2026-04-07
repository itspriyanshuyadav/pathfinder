import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] → ${config.method?.toUpperCase()} ${config.url}`);
  (config as Record<string, unknown>)._startTime = Date.now();
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const start = (response.config as Record<string, unknown>)._startTime as number;
    const duration = Date.now() - start;
    console.log(
      `[RESPONSE] ${response.config.url} — ${response.status} (${duration}ms)`
    );
    return response;
  },
  (error) => {
    if (error.code === "ECONNABORTED") {
      return Promise.reject(new Error("REQUEST_TIMEOUT"));
    }
    if (!error.response) {
      return Promise.reject(new Error("API_OFFLINE"));
    }
    if (error.response.status >= 500) {
      const msg =
        error.response.data?.detail || error.response.statusText || "Unknown server error";
      return Promise.reject(new Error(`SERVER_ERROR: ${msg}`));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
