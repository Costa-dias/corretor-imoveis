import { useEffect, useState } from "react";
import api, { formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ImageUploader, { resolveImageUrl } from "@/components/ImageUploader";
import { Plus, Pencil, Trash2, ArrowLeft, LogOut } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/format";

const empty = {
  title: "",
  location: "",
  price: "",
  images: [],
  description: "",
  listing_type: "venda",
};

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get("/properties")
      .then((res) => setProperties(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      title: p.title,
      location: p.location,
      price: String(p.price),
      images: p.images && p.images.length ? p.images : p.image_url ? [p.image_url] : [],
      description: p.description || "",
      listing_type: p.listing_type || "venda",
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.images || form.images.length === 0) {
      toast.error("Envie pelo menos 1 foto do imóvel.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        location: form.location.trim(),
        price: parseFloat(form.price),
        images: form.images,
        description: form.description.trim(),
        listing_type: form.listing_type,
      };
      if (editing) {
        await api.put(`/properties/${editing.id}`, payload);
        toast.success("Imóvel atualizado.");
      } else {
        await api.post("/properties", payload);
        toast.success("Imóvel cadastrado.");
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/properties/${deleteId}`);
      toast.success("Imóvel removido.");
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Erro ao remover");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div data-testid="admin-page" className="min-h-screen bg-white">
      <header className="border-b border-line bg-bone">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/")}
              data-testid="admin-back-btn"
              className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-stone hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
              Site
            </button>
            <span className="hidden text-[10px] uppercase tracking-[0.28em] text-stone md:inline">
              Painel do corretor
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-stone sm:inline">
              {user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                navigate("/");
              }}
              data-testid="admin-logout-btn"
              className="text-stone hover:text-ink"
            >
              <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-clay">
              Gestão
            </p>
            <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink">
              Meus imóveis
            </h1>
            <p className="mt-2 text-sm text-stone">
              {properties.length} anúncio(s) publicado(s)
            </p>
          </div>
          <Button
            onClick={openNew}
            data-testid="new-property-btn"
            className="h-12 rounded-none bg-ink px-6 text-bone hover:bg-clay"
          >
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Novo imóvel
          </Button>
        </div>

        <div className="border border-line bg-white">
          <Table data-testid="properties-table">
            <TableHeader>
              <TableRow className="border-line">
                <TableHead className="w-20">Foto</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Localidade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-stone">
                    Carregando…
                  </TableCell>
                </TableRow>
              ) : properties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-stone">
                    Nenhum imóvel cadastrado ainda.
                  </TableCell>
                </TableRow>
              ) : (
                properties.map((p) => (
                  <TableRow
                    key={p.id}
                    className="border-line"
                    data-testid={`admin-row-${p.id}`}
                  >
                    <TableCell>
                      <div className="h-12 w-16 overflow-hidden bg-line">
                        <img
                          src={resolveImageUrl(p.image_url)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-serif text-base text-ink">{p.title}</TableCell>
                    <TableCell className="text-sm text-stone">{p.location}</TableCell>
                    <TableCell>
                      <span className="text-[10px] uppercase tracking-[0.28em] text-clay">
                        {p.listing_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-serif text-base">
                      {formatBRL(p.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(p)}
                        data-testid={`edit-btn-${p.id}`}
                        className="text-stone hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.5} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(p.id)}
                        data-testid={`delete-btn-${p.id}`}
                        className="text-stone hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Property form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          data-testid="property-form-dialog"
          className="max-w-2xl border-line bg-bone"
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl tracking-tight">
              {editing ? "Editar imóvel" : "Novo imóvel"}
            </DialogTitle>
            <DialogDescription className="text-sm text-stone">
              Preencha as informações do imóvel abaixo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="mt-2 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-[10px] uppercase tracking-[0.28em] text-stone">
                  Título
                </Label>
                <Input
                  data-testid="form-title-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="mt-2 h-11 rounded-none border-line bg-white"
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-[0.28em] text-stone">
                  Localidade
                </Label>
                <Input
                  data-testid="form-location-input"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                  placeholder="Bairro, Cidade - UF"
                  className="mt-2 h-11 rounded-none border-line bg-white"
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-[0.28em] text-stone">
                  Valor (R$)
                </Label>
                <Input
                  data-testid="form-price-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  className="mt-2 h-11 rounded-none border-line bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-[10px] uppercase tracking-[0.28em] text-stone">
                  Fotos do imóvel
                </Label>
                <div className="mt-2">
                  <ImageUploader
                    images={form.images}
                    onChange={(imgs) => setForm({ ...form, images: imgs })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-[0.28em] text-stone">
                  Tipo
                </Label>
                <Select
                  value={form.listing_type}
                  onValueChange={(v) => setForm({ ...form, listing_type: v })}
                >
                  <SelectTrigger
                    data-testid="form-type-select"
                    className="mt-2 h-11 rounded-none border-line bg-white"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venda">Venda</SelectItem>
                    <SelectItem value="aluguel">Aluguel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-[10px] uppercase tracking-[0.28em] text-stone">
                  Descrição
                </Label>
                <Textarea
                  data-testid="form-description-input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="mt-2 rounded-none border-line bg-white"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="h-11 rounded-none border-ink text-ink"
                data-testid="form-cancel-btn"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-11 rounded-none bg-ink text-bone hover:bg-clay"
                data-testid="form-save-btn"
              >
                {saving ? "Salvando…" : editing ? "Salvar alterações" : "Publicar imóvel"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent
          data-testid="delete-dialog"
          className="max-w-md border-line bg-bone"
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl tracking-tight">
              Remover imóvel
            </DialogTitle>
            <DialogDescription className="text-sm text-stone">
              Esta ação não pode ser desfeita. O anúncio será removido do site.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="h-11 rounded-none border-ink text-ink"
              data-testid="delete-cancel-btn"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="h-11 rounded-none bg-destructive text-bone hover:opacity-90"
              data-testid="delete-confirm-btn"
            >
              {deleting ? "Removendo…" : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
