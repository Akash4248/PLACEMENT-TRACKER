import { Navigate, useLocation } from "react-router-dom";
import { LoadingState } from "../ui/StateBlock";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { booting, isAuthenticated } = useAuth();
  const location = useLocation();

  if (booting) {
    return <div className="p-6"><LoadingState label="Preparing workspace" /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
