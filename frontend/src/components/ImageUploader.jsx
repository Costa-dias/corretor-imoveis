import { useRef, useState } from "react";
import api, { formatApiErrorDetail, API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Upload, X, GripVertical } from "lucide-react";
import { toast } from "sonner";

// Resolve stored image URL: our upload endpoint returns "/api/files/{id}",
// legacy items may already have full https URLs.
export function resolveImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = API_BASE.replace(/\/api$/, "");
  return `${base}${url}`;
}

export default function ImageUploader({ images, onChange }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded = [];
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        try {
          const { data } = await api.post("/upload", form, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          uploaded.push(data.url);
        } catch (err) {
          toast.error(
            formatApiErrorDetail(err.response?.data?.detail) ||
              `Falha ao enviar ${file.name}`
          );
        }
      }
      if (uploaded.length) {
        onChange([...(images || []), ...uploaded]);
        toast.success(
          `${uploaded.length} foto${uploaded.length > 1 ? "s" : ""} enviada${
            uploaded.length > 1 ? "s" : ""
          }.`
        );
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (idx) => {
    const next = [...images];
    next.splice(idx, 1);
    onChange(next);
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    const next = [...images];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };

  return (
    <div data-testid="image-uploader">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
        data-testid="file-input"
      />

      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="h-11 rounded-none border-ink text-ink hover:bg-ink hover:text-bone"
        data-testid="upload-btn"
      >
        <Upload className="mr-2 h-4 w-4" strokeWidth={1.5} />
        {uploading
          ? "Enviando…"
          : images?.length
          ? "Adicionar mais fotos"
          : "Selecionar fotos do dispositivo"}
      </Button>

      <p className="mt-2 text-xs text-stone">
        JPG, PNG ou WEBP · até 15 MB por foto · a primeira foto será a capa
      </p>

      {images && images.length > 0 && (
        <div
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"
          data-testid="image-previews"
        >
          {images.map((url, i) => (
            <div
              key={url + i}
              className="group relative aspect-[4/3] overflow-hidden border border-line bg-white"
              data-testid={`image-preview-${i}`}
            >
              <img
                src={resolveImageUrl(url)}
                alt={`Foto ${i + 1}`}
                className="h-full w-full object-cover"
              />
              {i === 0 && (
                <span className="absolute left-2 top-2 bg-ink px-2 py-0.5 text-[9px] uppercase tracking-[0.28em] text-bone">
                  Capa
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-bone/90 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="text-stone hover:text-ink disabled:opacity-30"
                  data-testid={`move-up-${i}`}
                  title="Mover para cima"
                >
                  <GripVertical className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-stone hover:text-destructive"
                  data-testid={`remove-image-${i}`}
                  title="Remover"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
