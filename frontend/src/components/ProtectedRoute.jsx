import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {
  const isAuth = localStorage.getItem("wbc_auth") === "true";
  const role = localStorage.getItem("wbc_user_role");

  if (!isAuth || !role) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === "prospect") return <Navigate to="/my-deals" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
