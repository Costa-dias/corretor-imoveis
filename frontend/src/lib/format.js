export function formatBRL(value) {
  const n = Number(value || 0);
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function buildWhatsAppLink(phone, message) {
  const clean = String(phone || "").replace(/\D/g, "");
  const text = encodeURIComponent(message || "");
  return `https://wa.me/${clean}?text=${text}`;
}
