import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div
        data-testid="auth-loading"
        className="flex min-h-screen items-center justify-center bg-bone text-stone"
      >
        <span className="text-[10px] uppercase tracking-[0.28em]">Carregando…</span>
      </div>
    );
  }
  if (!user || user === false) return <Navigate to="/login" replace />;
  return children;
}
