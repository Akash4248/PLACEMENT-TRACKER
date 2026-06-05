import apiClient from "./client";

export const authApi = {
  login: (payload) => apiClient.post("/auth/login", payload),
  register: (payload) => apiClient.post("/auth/register", payload),
  me: () => apiClient.get("/auth/me"),
};

export const dashboardApi = {
  stats: () => apiClient.get("/dashboard/stats"),
  companyAnalytics: () => apiClient.get("/dashboard/company-analytics"),
  departmentAnalytics: () => apiClient.get("/dashboard/department-analytics"),
  funnel: () => apiClient.get("/dashboard/funnel"),
};

export const studentsApi = {
  list: (params) => apiClient.get("/students", { params }),
  create: (payload) => apiClient.post("/students", payload),
  update: (id, payload) => apiClient.put(`/students/${id}`, payload),
  remove: (id) => apiClient.delete(`/students/${id}`),
  resume: (id) => apiClient.get(`/students/${id}/resume`),
  uploadResume: (id, file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("resume", file);
    return apiClient.post(`/students/${id}/resume`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
  },
  verifyResume: (id) => apiClient.put(`/students/${id}/verify-resume`),
  rejectResume: (id) => apiClient.put(`/students/${id}/reject-resume`),
  import: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/students/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
  },
};

export const companiesApi = {
  list: () => apiClient.get("/companies"),
  get: (id) => apiClient.get(`/companies/${id}`),
  eligibleStudents: (id) => apiClient.get(`/companies/${id}/eligible-students`),
  shortlist: (id) => apiClient.get(`/companies/${id}/shortlist`),
  shortlistPdf: (id) => apiClient.get(`/companies/${id}/shortlist/pdf`, { responseType: "blob" }),
  funnel: (id) => apiClient.get(`/companies/${id}/funnel`),
  analytics: (id) => apiClient.get(`/companies/${id}/analytics`),
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
  bulkPass: (applicationIds) => apiClient.post("/applications/bulk/pass", { applicationIds }),
  bulkReject: (applicationIds) => apiClient.post("/applications/bulk/reject", { applicationIds }),
  bulkOffer: (applicationIds) => apiClient.post("/applications/bulk/offer", { applicationIds }),
  bulkDelete: (applicationIds) => apiClient.post("/applications/bulk/delete", { applicationIds }),
  bulkResults: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/applications/bulk-results", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
  },
};

export const roundsApi = {
  byCompany: (companyId) => apiClient.get(`/rounds/company/${companyId}`),
  analyticsByCompany: (companyId) => apiClient.get(`/rounds/company/${companyId}/analytics`),
  applications: (roundId) => apiClient.get(`/rounds/${roundId}/applications`),
  bulkPass: (roundId, applicationIds) => apiClient.post(`/rounds/${roundId}/bulk-pass`, { applicationIds }),
  bulkReject: (roundId, applicationIds) => apiClient.post(`/rounds/${roundId}/bulk-reject`, { applicationIds }),
  bulkAbsent: (roundId, applicationIds) => apiClient.post(`/rounds/${roundId}/bulk-absent`, { applicationIds }),
  create: (payload) => apiClient.post("/rounds", payload),
  update: (id, payload) => apiClient.put(`/rounds/${id}`, payload),
  remove: (id) => apiClient.delete(`/rounds/${id}`),
};

export const reportsApi = {
  placementAnalyticsPdf: () =>
    apiClient.get("/reports/placement-analytics/pdf", { responseType: "blob" }),
  placementAnalyticsXlsx: () =>
    apiClient.get("/reports/placement-analytics/xlsx", { responseType: "blob" }),
  companyPdf: (companyId) =>
    apiClient.get(`/reports/company/${companyId}/pdf`, { responseType: "blob" }),
  departmentPdf: (department) =>
    apiClient.get(`/reports/department/${encodeURIComponent(department)}/pdf`, {
      responseType: "blob",
    }),
  studentPdf: (studentId) =>
    apiClient.get(`/reports/student/${studentId}/pdf`, { responseType: "blob" }),
  funnelPdf: () =>
    apiClient.get("/reports/funnel/pdf", { responseType: "blob" }),
};
