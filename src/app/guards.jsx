import { Navigate, Outlet, useLocation } from "react-router-dom";
import { DEFAULT_APP_PATH } from "./routes";

export function ProtectedRoute({ user }) {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export function RoleGuard({ user, roles, children }) {
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={DEFAULT_APP_PATH} replace />;
  }
  return children;
}
