import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("role");

  // No session → redirect to login
  if (!token) return <Navigate to="/login" replace />;

  // If roles don’t match, block access
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
