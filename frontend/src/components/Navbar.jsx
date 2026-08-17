import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function Navbar({ broker }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header
      data-testid="site-header"
      className="sticky top-0 z-40 border-b border-line bg-bone/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link
          to="/"
          data-testid="brand-link"
          className="flex items-baseline gap-3"
        >
          <span className="font-serif text-2xl tracking-tight text-ink">
            {broker?.name?.split(" ")[0] || "Imóveis"}
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.28em] text-stone sm:inline">
            Imóveis Premium
          </span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <a
            href="#imoveis"
            data-testid="nav-imoveis"
            className="hidden text-stone transition-colors hover:text-ink sm:inline"
          >
            Imóveis
          </a>
          <a
            href="#corretor"
            data-testid="nav-corretor"
            className="hidden text-stone transition-colors hover:text-ink sm:inline"
          >
            Corretor
          </a>
          <a
            href="#contato"
            data-testid="nav-contato"
            className="hidden text-stone transition-colors hover:text-ink sm:inline"
          >
            Contato
          </a>
          {user && user !== false ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                data-testid="admin-link"
                onClick={() => navigate("/admin")}
                className="border-ink text-ink hover:bg-ink hover:text-bone"
              >
                Painel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                data-testid="logout-btn"
                onClick={logout}
                className="text-stone hover:text-ink"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              data-testid="login-nav-btn"
              onClick={() => navigate("/login")}
              className="text-stone hover:text-ink"
            >
              Acesso
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
