import { useEffect, useState } from "react";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import PropertyDetailDialog from "@/components/PropertyDetailDialog";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/format";
import { MessageCircle } from "lucide-react";

export default function HomePage() {
  const [properties, setProperties] = useState([]);
  const [broker, setBroker] = useState(null);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/properties"), api.get("/broker")])
      .then(([p, b]) => {
        setProperties(p.data);
        setBroker(b.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const openDetail = (p) => {
    setSelected(p);
    setOpen(true);
  };

  const heroImage =
    "https://images.unsplash.com/photo-1721815693498-cc28507c0ba2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzV8MHwxfHNlYXJjaHw0fHxsdXh1cnklMjBtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDB8fHx8MTc4NDA0MTU2NHww&ixlib=rb-4.1.0&q=85";

  return (
    <div className="min-h-screen bg-bone" data-testid="home-page">
      <Navbar broker={broker} />

      {/* HERO */}
      <section className="relative">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-24">
          <div className="lg:col-span-5 lg:pt-8">
            <p
              data-testid="hero-eyebrow"
              className="text-[10px] uppercase tracking-[0.32em] text-clay"
            >
              {broker?.creci || "Imóveis Premium"} · {broker?.city || ""}
            </p>
            <h1
              data-testid="hero-title"
              className="mt-6 font-serif text-5xl leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl"
            >
              Seu imóvel
              <br />
              na
              <span className="italic text-clay"> Praia Grande</span>
              <br />
              começa aqui.
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-stone">
              {broker?.tagline ||
                "Imóveis selecionados em Praia Grande. Atendimento sob medida, 24 horas por dia."}
            </p>

            <div
              data-testid="hero-highlights"
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <span
                data-testid="badge-price-from"
                className="inline-flex items-center bg-ink px-4 py-2 font-serif text-base tracking-tight text-bone"
              >
                {broker?.price_from || "A partir de R$ 250.000"}
              </span>
              <span
                data-testid="badge-hours"
                className="inline-flex items-center gap-2 border border-ink px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-ink"
              >
                <span className="inline-block h-2 w-2 animate-pulse bg-whatsapp" />
                {broker?.hours || "Atendimento 24 horas"}
              </span>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                data-testid="hero-cta-imoveis"
                className="h-12 rounded-none bg-ink px-8 text-bone hover:bg-clay"
                onClick={() =>
                  document
                    .getElementById("imoveis")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Ver imóveis
              </Button>
              <Button
                asChild
                variant="outline"
                data-testid="hero-cta-whatsapp"
                className="h-12 rounded-none border-ink text-ink hover:bg-ink hover:text-bone"
              >
                <a
                  href={buildWhatsAppLink(
                    broker?.phone,
                    `Olá ${broker?.name || ""}, gostaria de saber mais sobre os imóveis disponíveis em Praia Grande.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                  Falar com corretor
                </a>
              </Button>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="relative aspect-[4/5] w-full overflow-hidden border border-line bg-white lg:aspect-[4/5]">
              <img
                src={heroImage}
                alt="Residência premium em Praia Grande"
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between bg-bone/85 p-5 backdrop-blur">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-stone">
                    Destaque
                  </p>
                  <p className="mt-2 font-serif text-2xl tracking-tight text-ink">
                    Imóveis em Praia Grande
                  </p>
                </div>
                <span className="font-serif text-xl tracking-tight text-clay">
                  24h
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LISTINGS */}
      <section
        id="imoveis"
        data-testid="listings-section"
        className="border-t border-line"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
          <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-clay">
                Portfólio
              </p>
              <h2 className="mt-4 font-serif text-4xl tracking-tight text-ink sm:text-5xl">
                Imóveis disponíveis
              </h2>
            </div>
            <p className="max-w-sm text-sm text-stone">
              Uma seleção discreta de residências e apartamentos com padrão de acabamento premium.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/5] animate-pulse border border-line bg-white"
                />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div
              data-testid="empty-properties"
              className="border border-line bg-white p-16 text-center"
            >
              <p className="font-serif text-2xl tracking-tight text-ink">
                Novos imóveis em breve.
              </p>
              <p className="mt-3 text-sm text-stone">
                Entre em contato para consultar oportunidades exclusivas.
              </p>
            </div>
          ) : (
            <div
              data-testid="properties-grid"
              className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3"
            >
              {properties.map((p, i) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  index={i}
                  onOpen={openDetail}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BROKER */}
      <section
        id="corretor"
        data-testid="broker-section"
        className="border-t border-line bg-white"
      >
        <div className="mx-auto max-w-4xl px-6 py-24 text-left lg:px-10">
          <p className="text-[10px] uppercase tracking-[0.32em] text-clay">
            Sobre o corretor
          </p>
          <h2 className="mt-5 font-serif text-4xl leading-tight tracking-tight text-ink sm:text-5xl">
            {broker?.name || "Corretor"}
          </h2>
          <p className="mt-3 text-xs uppercase tracking-[0.28em] text-stone">
            {broker?.creci} · {broker?.city}
          </p>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-stone">
            Corretor de imóveis atuando em Praia Grande e região com foco em atendimento
            humano e disponibilidade 24 horas. Curadoria de imóveis à beira-mar, para
            investimento ou moradia — a partir de R$ 250.000.
          </p>

          <dl className="mt-10 grid gap-6 border-t border-line pt-8 sm:grid-cols-3">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.28em] text-stone">
                Telefone
              </dt>
              <dd className="mt-2 font-serif text-xl tracking-tight text-ink">
                (13) 98207-6346
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.28em] text-stone">
                Atendimento
              </dt>
              <dd className="mt-2 font-serif text-xl tracking-tight text-ink">
                24 horas
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.28em] text-stone">
                Região
              </dt>
              <dd className="mt-2 font-serif text-xl tracking-tight text-ink">
                Praia Grande - SP
              </dd>
            </div>
          </dl>

          <Button
            asChild
            data-testid="broker-whatsapp-btn"
            className="mt-10 h-12 rounded-none bg-ink px-8 text-bone hover:bg-clay"
          >
            <a
              href={buildWhatsAppLink(
                broker?.phone,
                `Olá ${broker?.name || ""}, gostaria de conversar sobre um imóvel em Praia Grande.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
              Conversar no WhatsApp
            </a>
          </Button>
        </div>
      </section>

      <Footer broker={broker} />

      <PropertyDetailDialog
        property={selected}
        broker={broker}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
