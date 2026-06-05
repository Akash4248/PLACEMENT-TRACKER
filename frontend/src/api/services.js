import apiClient from "./client";

export const authApi = {
  login: (payload) => apiClient.post("/auth/login", payload),
  register: (payload) => apiClient.post("/auth/register", payload),
  me: () => apiClient.get("/auth/me"),
};

export const dashboardApi = {
  stats: () => apiClient.get("/dashboard/stats"),
  companyAnalytics: () => apiClient.get("/dashboard/company-analytics"),
};

export const studentsApi = {
  list: (params) => apiClient.get("/students", { params }),
  create: (payload) => apiClient.post("/students", payload),
  update: (id, payload) => apiClient.put(`/students/${id}`, payload),
  remove: (id) => apiClient.delete(`/students/${id}`),
};

export const companiesApi = {
  list: () => apiClient.get("/companies"),
  create: (payload) => apiClient.post("/companies", payload),
  update: (id, payload) => apiClient.put(`/companies/${id}`, payload),
  remove: (id) => apiClient.delete(`/companies/${id}`),
};

export const applicationsApi = {
  list: (params) => apiClient.get("/applications", { params }),
  create: (payload) => apiClient.post("/applications", payload),
  updateResult: (id, payload) => apiClient.put(`/applications/${id}/result`, payload),
  markOffer: (id) => apiClient.put(`/applications/${id}/offer`),
  remove: (id) => apiClient.delete(`/applications/${id}`),
};

export const roundsApi = {
  byCompany: (companyId) => apiClient.get(`/rounds/company/${companyId}`),
  create: (payload) => apiClient.post("/rounds", payload),
  update: (id, payload) => apiClient.put(`/rounds/${id}`, payload),
  remove: (id) => apiClient.delete(`/rounds/${id}`),
};
