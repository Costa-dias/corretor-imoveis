export default function Footer({ broker }) {
  return (
    <footer
      id="contato"
      data-testid="site-footer"
      className="mt-32 border-t border-line bg-bone"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-3 lg:px-10">
        <div>
          <p className="font-serif text-3xl tracking-tight text-ink">
            {broker?.name || "Corretor"}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.28em] text-stone">
            {broker?.creci || ""}
          </p>
          <p className="mt-6 max-w-sm text-sm text-stone">
            {broker?.tagline || ""}
          </p>
        </div>
        <div className="lg:pl-8">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone">
            Contato direto
          </p>
          <p className="mt-4 font-serif text-2xl tracking-tight" data-testid="footer-phone">
            {formatPhone(broker?.phone)}
          </p>
          <p className="mt-2 text-sm text-stone">
            {broker?.hours || "Atendimento 24 horas por WhatsApp"}
          </p>
        </div>
        <div className="lg:pl-8">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone">
            Escritório
          </p>
          <p className="mt-4 text-sm text-stone">
            {broker?.city || "Praia Grande - SP"}
            <br />
            Litoral Paulista
            <br />
            Atendimento presencial sob agendamento.
          </p>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-xs text-stone lg:px-10">
          <span>© {new Date().getFullYear()} {broker?.name || "Corretor"}. Todos os direitos reservados.</span>
          <span className="uppercase tracking-[0.28em]">Site imobiliário</span>
        </div>
      </div>
    </footer>
  );
}

function formatPhone(p) {
  if (!p) return "";
  const s = String(p).replace(/\D/g, "");
  if (s.length < 4) return s;
  // Brazilian format: assume starts with country code 55 + DDD (2) + rest
  if (s.startsWith("55") && s.length > 4) {
    const dd = s.slice(2, 4);
    const rest = s.slice(4);
    const mid = rest.slice(0, rest.length - 4);
    const last = rest.slice(-4);
    return `+55 (${dd}) ${mid}-${last}`;
  }
  return `+${s}`;
}
