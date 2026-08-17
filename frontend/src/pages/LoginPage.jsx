import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      toast.success("Bem-vindo(a) de volta.");
      navigate("/admin", { replace: true });
    } else {
      setError(res.error || "Falha no login");
    }
  };

  return (
    <div
      data-testid="login-page"
      className="grid min-h-screen bg-bone md:grid-cols-2"
    >
      <div className="hidden md:block">
        <img
          alt="Interior premium"
          src="https://images.unsplash.com/photo-1638454668466-e8dbd5462f20?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHw0fHxwcmVtaXVtJTIwYXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHx8fHwxNzg0MDQxNTY0fDA&ixlib=rb-4.1.0&q=85"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex items-center justify-center px-6 py-16 lg:px-16">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            data-testid="back-home-link"
            className="text-[10px] uppercase tracking-[0.28em] text-stone hover:text-ink"
          >
            ← Voltar ao site
          </Link>
          <h1 className="mt-8 font-serif text-4xl leading-tight tracking-tight text-ink">
            Acesso do corretor
          </h1>
          <p className="mt-3 text-sm text-stone">
            Entre para gerenciar seus imóveis.
          </p>

          <form onSubmit={submit} className="mt-10 space-y-5">
            <div>
              <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.28em] text-stone">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                data-testid="login-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 h-12 rounded-none border-line bg-white focus-visible:ring-clay"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-[10px] uppercase tracking-[0.28em] text-stone">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                data-testid="login-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 h-12 rounded-none border-line bg-white focus-visible:ring-clay"
              />
            </div>

            {error && (
              <p
                data-testid="login-error"
                className="border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              data-testid="login-submit-btn"
              disabled={loading}
              className="h-12 w-full rounded-none bg-ink text-bone hover:bg-clay"
            >
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
