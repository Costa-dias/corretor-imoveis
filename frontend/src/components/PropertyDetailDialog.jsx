import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { formatBRL, buildWhatsAppLink } from "@/lib/format";
import { resolveImageUrl } from "@/components/ImageUploader";

export default function PropertyDetailDialog({ property, broker, open, onOpenChange }) {
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    setActiveIdx(0);
  }, [property?.id]);
  if (!property) return null;
  const images =
    property.images && property.images.length
      ? property.images
      : property.image_url
      ? [property.image_url]
      : [];
  const activeImage = images[activeIdx] || property.image_url;
  const isRent = property.listing_type === "aluguel";
  const waMsg = `Olá ${broker?.name || ""}, tenho interesse no imóvel "${property.title}" em ${property.location}.`;
  const waLink = buildWhatsAppLink(broker?.phone, waMsg);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="property-detail-dialog"
        className="max-w-5xl gap-0 overflow-hidden border-line bg-bone p-0"
      >
        <DialogTitle className="sr-only">{property.title}</DialogTitle>
        <DialogDescription className="sr-only">
          Detalhes do imóvel {property.title} em {property.location}
        </DialogDescription>
        <div className="grid gap-0 md:grid-cols-2">
          <div className="flex flex-col bg-line">
            <div className="aspect-[4/5] w-full overflow-hidden md:aspect-auto md:flex-1">
              <img
                src={resolveImageUrl(activeImage)}
                alt={property.title}
                className="h-full w-full object-cover"
                data-testid="detail-main-image"
              />
            </div>
            {images.length > 1 && (
              <div
                data-testid="detail-thumbs"
                className="flex gap-2 overflow-x-auto bg-bone p-3"
              >
                {images.map((img, i) => (
                  <button
                    key={img + i}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    data-testid={`detail-thumb-${i}`}
                    className={`h-16 w-20 shrink-0 overflow-hidden border transition-opacity ${
                      i === activeIdx
                        ? "border-ink opacity-100"
                        : "border-line opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={resolveImageUrl(img)}
                      alt={`Foto ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between p-8 md:p-10">
            <div>
              <span
                data-testid="detail-badge"
                className="inline-block bg-ink px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-bone"
              >
                {isRent ? "Aluguel" : "Venda"}
              </span>
              <h2
                data-testid="detail-title"
                className="mt-5 font-serif text-3xl leading-tight tracking-tight text-ink md:text-4xl"
              >
                {property.title}
              </h2>
              <div className="mt-3 flex items-center gap-2 text-sm text-stone">
                <MapPin className="h-4 w-4" strokeWidth={1.5} />
                <span data-testid="detail-location">{property.location}</span>
              </div>
              <div className="my-8 h-px w-full bg-line" />
              <p
                data-testid="detail-price"
                className="font-serif text-4xl tracking-tight text-ink"
              >
                {formatBRL(property.price)}
                {isRent && (
                  <span className="ml-2 text-base font-sans font-light text-stone">
                    /mês
                  </span>
                )}
              </p>
              {property.description && (
                <p
                  data-testid="detail-description"
                  className="mt-6 max-w-md text-sm leading-relaxed text-stone"
                >
                  {property.description}
                </p>
              )}
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                data-testid="whatsapp-btn"
                className="h-12 rounded-none bg-ink px-6 text-bone hover:bg-clay"
              >
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                  Falar no WhatsApp
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                data-testid="call-btn"
                className="h-12 rounded-none border-ink text-ink hover:bg-ink hover:text-bone"
              >
                <a href={`tel:+${String(broker?.phone || "").replace(/\D/g, "")}`}>
                  Ligar agora
                </a>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
