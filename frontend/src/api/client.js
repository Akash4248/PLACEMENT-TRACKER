import axios from "axios";
import logger from "../utils/logger";

const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api",
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("campustrack_token");
  config.metadata = { startTime: performance.now() };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  logger.debug("[API] request", {
    method: config.method?.toUpperCase(),
    url: config.url,
    payload: config.data,
  });

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const duration = Math.round(
      performance.now() - response.config.metadata.startTime
    );
    logger.info("[API] response", {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
      duration: `${duration}ms`,
    });
    return response;
  },
  (error) => {
    const duration = error.config?.metadata
      ? Math.round(performance.now() - error.config.metadata.startTime)
      : null;
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";

    logger.error("[API] failure", {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      duration: duration ? `${duration}ms` : "n/a",
      message,
    });

    return Promise.reject({
      ...error,
      message,
    });
  }
);

export default apiClient;
