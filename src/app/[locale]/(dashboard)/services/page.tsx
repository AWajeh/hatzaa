"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plus, MoreVertical, Search, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";
import { serviceCategorySchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ServiceFormDialog } from "@/components/services/service-form-dialog";

interface ServiceCategory {
  id: string;
  name: string;
  sortOrder: number;
}

interface ServiceRecord {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  unit: string;
  price: string;
  notes: string | null;
  category: ServiceCategory | null;
}

const ALL = "__all__";

export default function ServicesPage() {
  const t = useTranslations("services");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRecord | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(handle);
  }, [search]);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/service-categories");
    if (!res.ok) return;
    const data = await res.json();
    setCategories(data.categories);
  }, []);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (activeCategory !== ALL) params.set("categoryId", activeCategory);
      const res = await fetch(`/api/services?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setServices(data.services);
    } catch {
      toast.error(tc("somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeCategory, tc]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const openAdd = () => {
    setEditingService(null);
    setFormOpen(true);
  };

  const openEdit = (service: ServiceRecord) => {
    setEditingService(service);
    setFormOpen(true);
  };

  const handleDelete = async (service: ServiceRecord) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/services/${service.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setServices((prev) => prev.filter((s) => s.id !== service.id));
      toast.success(t("deleted"));
    } catch {
      toast.error(tc("somethingWentWrong"));
    }
  };

  const handleCreateCategory = async () => {
    const parsed = serviceCategorySchema.safeParse({ name: newCategoryName.trim() });
    if (!parsed.success) return;
    setSavingCategory(true);
    try {
      const res = await fetch("/api/service-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategories((prev) => [...prev, data.category]);
      setNewCategoryName("");
      setCategoryDialogOpen(false);
      toast.success(t("categoryCreated"));
    } catch {
      toast.error(tc("somethingWentWrong"));
    } finally {
      setSavingCategory(false);
    }
  };

  const isEmptyOverall = !loading && services.length === 0 && !debouncedSearch && activeCategory === ALL;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          {t("add")}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 overflow-x-auto">
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList>
                <TabsTrigger value={ALL}>{t("allCategories")}</TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setCategoryDialogOpen(true)}
            aria-label={t("newCategory")}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="ps-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : isEmptyOverall ? (
        <EmptyState
          icon={Tag}
          title={t("empty.title")}
          description={t("empty.description")}
          action={<Button onClick={openAdd}>{t("empty.cta")}</Button>}
        />
      ) : services.length === 0 ? (
        <EmptyState title={tc("noResults")} />
      ) : (
        <>
          <div className="space-y-2 sm:hidden">
            {services.map((service) => (
              <Card key={service.id}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{service.name}</p>
                    {service.description && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{service.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {service.category && <Badge variant="primary">{service.category.name}</Badge>}
                      <span className="text-xs text-muted-foreground">{service.unit}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {formatMoney(service.price, locale)}
                    </span>
                    <RowActions onEdit={() => openEdit(service)} onDelete={() => handleDelete(service)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("fields.name")}</TableHead>
                  <TableHead>{t("fields.category")}</TableHead>
                  <TableHead>{t("fields.unit")}</TableHead>
                  <TableHead>{t("fields.price")}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{service.name}</p>
                      {service.description && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                          {service.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {service.category ? (
                        <Badge variant="primary">{service.category.name}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("noCategory")}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{service.unit}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      {formatMoney(service.price, locale)}
                    </TableCell>
                    <TableCell>
                      <RowActions onEdit={() => openEdit(service)} onDelete={() => handleDelete(service)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      <ServiceFormDialog
        key={editingService?.id ?? "new"}
        service={editingService}
        categories={categories}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={loadServices}
      />

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("newCategory")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="new-category-name">{t("fields.category")}</Label>
            <Input
              id="new-category-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateCategory();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleCreateCategory}
              loading={savingCategory}
              disabled={!newCategoryName.trim()}
            >
              {tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const tc = useTranslations("common");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={tc("actions")}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          {tc("edit")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4" />
          {tc("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
