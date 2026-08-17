import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { LoginPage, ResetPasswordPage } from "@/features/auth";
import { useAuth } from "@/features/auth/hooks/useAuth";
import Workspace from "./Workspace";
import { ProtectedRoute } from "./guards";
import { DEFAULT_APP_PATH } from "./routes";

function LoginRoute({ auth }) {
  const location = useLocation();
  const navigate = useNavigate();
  if (auth.user) return <Navigate to={DEFAULT_APP_PATH} replace />;

  const onLogin = async (username, password, remember) => {
    const authenticated = await auth.login(username, password, remember);
    if (authenticated) {
      const requestedPath = location.state?.from?.pathname;
      navigate(requestedPath && requestedPath !== "/login" ? requestedPath : DEFAULT_APP_PATH, {
        replace: true,
      });
    }
  };

  return <LoginPage onLogin={onLogin} error={auth.error} />;
}

export default function AppRouter() {
  const auth = useAuth();

  if (auth.loading) {
    return <div className="auth-shell"><div className="text-muted">Loading session...</div></div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute auth={auth} />} />
      <Route
        path="/reset-password"
        element={auth.user ? <Navigate to={DEFAULT_APP_PATH} replace /> : <ResetPasswordPage />}
      />
      <Route element={<ProtectedRoute user={auth.user} />}>
        <Route path="/*" element={<Workspace user={auth.user} onLogout={auth.logout} />} />
      </Route>
    </Routes>
  );
}
