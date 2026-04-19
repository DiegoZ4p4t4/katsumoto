import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDespatches } from "@/hooks/useDespatches";
import { useDespatchMutations } from "@/hooks/useDespatchMutations";
import { useDespatchDetail } from "@/hooks/useDespatches";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/data-table/PaginationControls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2, AlertCircle, RefreshCw, Truck,
  MoreHorizontal, Eye, Send, XCircle, Construction,
} from "lucide-react";
import { formatDate, formatInvoiceNumber } from "@/lib/format";
import type { Despatch } from "@/lib/types/despatch";
import { MOTIVO_TRASLADO_LABELS } from "@/lib/types/despatch";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Borrador", variant: "secondary" },
  issued: { label: "Emitida", variant: "outline" },
  accepted: { label: "Aceptada", variant: "default" },
  cancelled: { label: "Anulada", variant: "destructive" },
};

export default function Despatches() {
  const { despatches, isLoading, error } = useDespatches();
  const { sendToSunat, isSendingToSunat, updateStatus } = useDespatchMutations();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewDespatch, setViewDespatch] = useState<Despatch | null>(null);

  const { despatch: detailDespatch } = useDespatchDetail(viewDespatch?.id || null);

  const filtered = useMemo(
    () =>
      despatches.filter((d) => {
        return statusFilter === "all" || d.status === statusFilter;
      }),
    [despatches, statusFilter],
  );

  const pagination = usePagination({ totalItems: filtered.length });
  const paginated = useMemo(
    () => filtered.slice(pagination.startIndex, pagination.endIndex),
    [filtered, pagination.startIndex, pagination.endIndex],
  );

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
        <p className="text-muted-foreground text-center">Error al cargar las guias</p>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries()} className="rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" />Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Guias de Remision</h1>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-6">
        <div className="flex items-start gap-4">
          <Construction className="w-8 h-8 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">Modulo en desarrollo</h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Las Guias de Remision Electronica (GRE) se encuentran en fase de desarrollo activo.
              La creacion y envio a SUNAT via REST API estara disponible proximamente.
              Actualmente puedes consultar las guias ya registradas.
            </p>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground -mt-4">
        {despatches.length} guias
      </p>

      <div className="flex gap-2 flex-wrap">
        {["all", "issued", "accepted", "cancelled"].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
            className="rounded-xl"
          >
            {s === "all" ? "Todas" : statusConfig[s]?.label || s}
          </Button>
        ))}
      </div>

      {despatches.length === 0 ? (
        <div className="text-center py-16">
          <Truck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground mb-1">No hay guias</p>
          <p className="text-sm text-muted-foreground">
            Las guias de remision estaran disponibles proximamente.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Destinatario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((d) => {
                  const st = statusConfig[d.status] || statusConfig.draft;
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">
                        {formatInvoiceNumber(d.serie, d.correlativo)}
                      </TableCell>
                      <TableCell>{formatDate(d.issue_date)}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {d.motivo_traslado} - {MOTIVO_TRASLADO_LABELS[d.motivo_traslado] || d.descripcion_motivo}
                        </span>
                      </TableCell>
                      <TableCell>{d.destinatario_nombre}</TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewDespatch(d)}>
                              <Eye className="w-4 h-4 mr-2" />Ver detalle
                            </DropdownMenuItem>
                            {d.status === "issued" && !d.sunat_sent_at && (
                              <DropdownMenuItem
                                onClick={() => sendToSunat(d.id)}
                                disabled={isSendingToSunat}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                {isSendingToSunat ? "Enviando..." : "Enviar a SUNAT"}
                              </DropdownMenuItem>
                            )}
                            {d.status === "issued" && (
                              <DropdownMenuItem onClick={() => updateStatus(d.id, "cancelled")}>
                                <XCircle className="w-4 h-4 mr-2" />Anular
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <PaginationControls pagination={pagination} totalItems={filtered.length} itemLabel="guias" showPageNumbers />
        </>
      )}

      <Dialog open={!!viewDespatch} onOpenChange={(open) => { if (!open) setViewDespatch(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Guia {viewDespatch ? formatInvoiceNumber(viewDespatch.serie, viewDespatch.correlativo) : ""}
            </DialogTitle>
          </DialogHeader>
          {detailDespatch && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-muted-foreground">Motivo:</span> {detailDespatch.motivo_traslado} - {MOTIVO_TRASLADO_LABELS[detailDespatch.motivo_traslado]}</div>
                <div><span className="text-muted-foreground">Descripcion:</span> {detailDespatch.descripcion_motivo}</div>
                <div><span className="text-muted-foreground">Fecha traslado:</span> {formatDate(detailDespatch.fecha_inicio_traslado)}</div>
                <div><span className="text-muted-foreground">Peso bruto:</span> {detailDespatch.peso_bruto_total} kg</div>
                <div><span className="text-muted-foreground">Bultos:</span> {detailDespatch.numero_bultos}</div>
                <div><span className="text-muted-foreground">Placa:</span> {detailDespatch.vehiculo_placa}</div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Destinatario</h4>
                <p>{detailDespatch.destinatario_nombre} ({detailDespatch.destinatario_tipo_doc}: {detailDespatch.destinatario_documento})</p>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Transportista</h4>
                <p>{detailDespatch.transportista_nombre} ({detailDespatch.transportista_documento})</p>
                <p>Conductor: {detailDespatch.conductor_nombre} - Lic: {detailDespatch.conductor_licencia}</p>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Ruta</h4>
                <p><span className="text-muted-foreground">Partida:</span> {detailDespatch.remitente_direccion} ({detailDespatch.remitente_ubigeo})</p>
                <p><span className="text-muted-foreground">Llegada:</span> {detailDespatch.destino_direccion} ({detailDespatch.destino_ubigeo})</p>
              </div>
              {detailDespatch.items && detailDespatch.items.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Unidad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailDespatch.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {detailDespatch.sunat_sent_at && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">SUNAT</h4>
                  <p><span className="text-muted-foreground">Enviada:</span> {formatDate(detailDespatch.sunat_sent_at)}</p>
                  {detailDespatch.sunat_hash && <p><span className="text-muted-foreground">Hash:</span> {detailDespatch.sunat_hash}</p>}
                  {detailDespatch.sunat_error_message && <p className="text-red-500"><span className="text-muted-foreground">Error:</span> {detailDespatch.sunat_error_message}</p>}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
