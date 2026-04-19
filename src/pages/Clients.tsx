import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { useClients } from "@/hooks/useClients";
import { useClientMutations } from "@/hooks/useClientMutations";
import { PaginationControls } from "@/components/data-table/PaginationControls";
import { clientFormSchema, type ClientFormValues } from "@/lib/schemas";
import { HelpHint } from "@/components/HelpHint";
import { HELP_TEXTS } from "@/lib/help-texts";
import { ClientStats } from "@/components/clients/ClientStats";
import { ClientFilters } from "@/components/clients/ClientFilters";
import { ClientTable } from "@/components/clients/ClientTable";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import type { Customer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Loader2, AlertCircle, RefreshCw, Users } from "lucide-react";

const defaultValues: ClientFormValues = {
  name: "", document_type: "RUC", document_number: "",
  phone: "", email: "", address: "", city: "",
};

export default function Clients() {
  const { clients, getInvoiceCount, usedCities, isLoading, error } = useClients();
  const { saveClientAsync, deleteClient } = useClientMutations();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [docFilter, setDocFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
  });

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const q = debouncedSearch.toLowerCase();
      const matchSearch = c.name.toLowerCase().includes(q) || c.document_number.toLowerCase().includes(q) || (c.email && c.email.toLowerCase().includes(q));
      const matchDoc = docFilter === "all" || c.document_type === docFilter;
      const matchCity = cityFilter === "all" || c.city === cityFilter;
      return matchSearch && matchDoc && matchCity;
    });
  }, [clients, debouncedSearch, docFilter, cityFilter]);

  const clientComparators = useMemo(() => ({
    name: (a: Customer, b: Customer) => a.name.localeCompare(b.name),
    document_type: (a: Customer, b: Customer) => a.document_type.localeCompare(b.document_type),
    document_number: (a: Customer, b: Customer) => a.document_number.localeCompare(b.document_number),
    city: (a: Customer, b: Customer) => (a.city || "").localeCompare(b.city || ""),
    invoices: (a: Customer, b: Customer) => getInvoiceCount(a.id) - getInvoiceCount(b.id),
  }), [getInvoiceCount]);

  const { sort, toggleSort, sorted } = useTableSort(filtered, { comparators: clientComparators, defaultColumn: "name" });
  const pagination = usePagination({ totalItems: sorted.length });
  const paginated = useMemo(() => sorted.slice(pagination.startIndex, pagination.endIndex), [sorted, pagination.startIndex, pagination.endIndex]);

  const { totalRUC, totalWithInvoices } = useMemo(() => ({
    totalRUC: filtered.filter((c) => c.document_type === "RUC").length,
    totalWithInvoices: filtered.filter((c) => getInvoiceCount(c.id) > 0).length,
  }), [filtered, getInvoiceCount]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-muted-foreground text-center">Error al cargar los clientes</p>
        <p className="text-xs text-muted-foreground">{error.message}</p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries()} className="rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" />Reintentar
        </Button>
      </div>
    );
  }

  const updateSearch = (v: string) => { setSearch(v); pagination.resetPage(); };
  const updateDocFilter = (v: string) => { setDocFilter(v); pagination.resetPage(); };
  const updateCityFilter = (v: string) => { setCityFilter(v); pagination.resetPage(); };

  const openNew = () => { setEditingClient(null); form.reset(defaultValues); setDialogOpen(true); };
  const openEdit = (client: Customer) => {
    setEditingClient(client);
    form.reset({
      name: client.name, document_type: client.document_type, document_number: client.document_number,
      phone: client.phone || "", email: client.email || "", address: client.address || "", city: client.city || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async (data: ClientFormValues) => {
    try {
      await saveClientAsync(data, editingClient);
      setDialogOpen(false);
    } catch {
      // handled by onError
    }
  };

  const confirmDelete = () => {
    if (deleteId) deleteClient(deleteId);
    setDeleteOpen(false); setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold">Clientes</h1>
          <HelpHint {...HELP_TEXTS.clients} />
        </div>
        <Button onClick={openNew} className="rounded-xl bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />Nuevo Cliente
        </Button>
      </div>

      <ClientStats total={filtered.length} totalRUC={totalRUC} totalWithInvoices={totalWithInvoices} />

      {clients.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground mb-1">No hay clientes registrados</p>
          <p className="text-sm text-muted-foreground mb-4">Agrega tu primer cliente para empezar a emitir comprobantes.</p>
          <Button onClick={openNew} className="rounded-xl bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" />Crear Primer Cliente
          </Button>
        </div>
      ) : (
        <>
          <ClientFilters search={search} onSearchChange={updateSearch} docFilter={docFilter} onDocFilterChange={updateDocFilter}
            cityFilter={cityFilter} onCityFilterChange={updateCityFilter} usedCities={usedCities} />

          <ClientTable paginated={paginated} sort={sort} toggleSort={toggleSort} filtered={filtered}
            getInvoiceCount={getInvoiceCount} onEdit={openEdit} onDelete={(id) => { setDeleteId(id); setDeleteOpen(true); }} />

          <PaginationControls pagination={pagination} totalItems={sorted.length} itemLabel="clientes" showPageNumbers />
        </>
      )}

      <ClientFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editingClient={editingClient} form={form} onSave={handleSave} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. El cliente será eliminado permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
