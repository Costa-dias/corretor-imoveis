import { formatBRL } from "@/lib/format";
import { resolveImageUrl } from "@/components/ImageUploader";

export default function PropertyCard({ property, onOpen, index = 0 }) {
  const isRent = property.listing_type === "aluguel";
  return (
    <button
      data-testid={`property-card-${property.id}`}
      onClick={() => onOpen(property)}
      className="group text-left animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative overflow-hidden border border-line bg-white">
        <div className="aspect-[4/5] w-full overflow-hidden">
          <img
            src={resolveImageUrl(property.image_url)}
            alt={property.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>
        <span
          data-testid={`property-badge-${property.id}`}
          className="absolute left-4 top-4 bg-bone/90 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-ink backdrop-blur"
        >
          {isRent ? "Aluguel" : "Venda"}
        </span>
      </div>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone">
            {property.location}
          </p>
          <h3
            className="mt-2 truncate font-serif text-xl tracking-tight text-ink"
            data-testid={`property-title-${property.id}`}
          >
            {property.title}
          </h3>
        </div>
        <div className="shrink-0 text-right">
          <p
            className="font-serif text-lg tracking-tight text-ink"
            data-testid={`property-price-${property.id}`}
          >
            {formatBRL(property.price)}
            {isRent && (
              <span className="ml-1 text-xs font-sans font-light text-stone">
                /mês
              </span>
            )}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-clay transition-opacity opacity-0 group-hover:opacity-100">
            Ver detalhes →
          </p>
        </div>
      </div>
    </button>
  );
}
