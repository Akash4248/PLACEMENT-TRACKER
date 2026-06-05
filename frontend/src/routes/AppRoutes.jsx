import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import ApplicationsPage from "../pages/ApplicationsPage";
import AdminSystemPage from "../pages/AdminSystemPage";
import CompaniesPage from "../pages/CompaniesPage";
import CompanyAnalyticsPage from "../pages/CompanyAnalyticsPage";
import DashboardPage from "../pages/DashboardPage";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import ReportsPage from "../pages/ReportsPage";
import RoundDetailPage from "../pages/RoundDetailPage";
import RoundsPage from "../pages/RoundsPage";
import SignupPage from "../pages/SignupPage";
import StudentsPage from "../pages/StudentsPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="companies/:companyId/analytics" element={<CompanyAnalyticsPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="rounds" element={<RoundsPage />} />
        <Route path="rounds/:roundId" element={<RoundDetailPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="admin/system" element={<AdminSystemPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
