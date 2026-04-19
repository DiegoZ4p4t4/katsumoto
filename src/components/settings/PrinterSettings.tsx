import { useState, useCallback } from "react";
import { usePrinter } from "@/hooks/usePrinter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, Usb, Wifi, Loader2, AlertCircle, CheckCircle2, Monitor } from "lucide-react";
import type { PrinterConfig } from "@/lib/platform";

export function PrinterSettings() {
  const { config, updateConfig, isTauri, isPrinting, printTest, refreshStatus, status } = usePrinter();
  const [serialPorts, setSerialPorts] = useState<string[]>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "success" | "error">("idle");

  const detectPorts = useCallback(async () => {
    if (!isTauri) return;
    setLoadingPorts(true);
    try {
      const mod = await import(/* @vite-ignore */ ["@tauri-apps/api", "core"].join("/"));
      const ports = (await mod.invoke("list_serial_ports")) as string[];
      setSerialPorts(ports);
    } catch {
      setSerialPorts([]);
    } finally {
      setLoadingPorts(false);
    }
  }, [isTauri]);

  const handleTest = useCallback(async () => {
    setTestResult("idle");
    try {
      await printTest();
      setTestResult("success");
    } catch {
      setTestResult("error");
    }
    setTimeout(() => setTestResult("idle"), 5000);
  }, [printTest]);

  const handleRefresh = useCallback(async () => {
    await refreshStatus();
  }, [refreshStatus]);

  const set = useCallback((partial: Partial<PrinterConfig>) => {
    updateConfig(partial);
  }, [updateConfig]);

  const statusColor = status === "ready" ? "bg-green-500" : status === "disconnected" ? "bg-red-500" : status === "error" ? "bg-yellow-500" : "bg-gray-400";
  const statusLabel = status === "ready" ? "Conectada" : status === "disconnected" ? "Desconectada" : status === "error" ? "Error" : status === "checking" ? "Verificando..." : "Sin configurar";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Impresora Termica</h2>
        <p className="text-muted-foreground">Configurar impresora de tickets y cajon de dinero</p>
      </div>

      {!isTauri && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Monitor className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-200">Modo Web detectado</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  La impresion termica directa (ESC/POS) requiere la version desktop. Actualmente
                  la impresion se realizara via PDF con dialogo del navegador.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Conexion
              </CardTitle>
              <CardDescription>Tipo de conexion a la impresora</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${statusColor}`} />
              <span className="text-sm text-muted-foreground">{statusLabel}</span>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={status === "checking"}>
                {status === "checking" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Verificar"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={config.connectionType} onValueChange={(v) => set({ connectionType: v as PrinterConfig["connectionType"], enabled: v !== "browser-pdf" })}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="browser-pdf" className="gap-1">
                <Monitor className="h-4 w-4" /> PDF
              </TabsTrigger>
              <TabsTrigger value="usb-serial" disabled={!isTauri} className="gap-1">
                <Usb className="h-4 w-4" /> USB Serial
              </TabsTrigger>
              <TabsTrigger value="network-tcp" disabled={!isTauri} className="gap-1">
                <Wifi className="h-4 w-4" /> TCP/IP
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browser-pdf" className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                La impresion generara un PDF de 80mm y abrira el dialogo de impresion del navegador.
              </p>
            </TabsContent>

            <TabsContent value="usb-serial" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Puerto Serial</Label>
                <div className="flex gap-2">
                  <Select value={config.serialPortName || ""} onValueChange={(v) => set({ serialPortName: v })}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar puerto" />
                    </SelectTrigger>
                    <SelectContent>
                      {serialPorts.length === 0 ? (
                        <SelectItem value="_none" disabled>
                          Detecte puertos primero
                        </SelectItem>
                      ) : (
                        serialPorts.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={detectPorts} disabled={loadingPorts}>
                    {loadingPorts ? <Loader2 className="h-4 w-4 animate-spin" /> : "Detectar"}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Baud Rate</Label>
                <Select value={String(config.baudRate)} onValueChange={(v) => set({ baudRate: Number(v) as PrinterConfig["baudRate"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9600">9600</SelectItem>
                    <SelectItem value="19200">19200</SelectItem>
                    <SelectItem value="38400">38400</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="network-tcp" className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Direccion IP</Label>
                  <Input
                    value={config.networkIp || ""}
                    onChange={(e) => set({ networkIp: e.target.value })}
                    placeholder="192.168.1.50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Puerto</Label>
                  <Input
                    type="number"
                    value={config.networkPort ?? 9100}
                    onChange={(e) => set({ networkPort: Number(e.target.value) })}
                    placeholder="9100"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ancho de Papel</Label>
              <Select value={String(config.paperWidth)} onValueChange={(v) => {
                const w = Number(v) as 80 | 58;
                set({ paperWidth: w, charsPerLine: w === 80 ? 48 : 32 });
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="80">80mm (48 chars)</SelectItem>
                  <SelectItem value="58">58mm (32 chars)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Copias</Label>
              <Select value={String(config.copies)} onValueChange={(v) => set({ copies: Number(v) as 1 | 2 | 3 })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 copia</SelectItem>
                  <SelectItem value="2">2 copias</SelectItem>
                  <SelectItem value="3">3 copias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-imprimir al vender</Label>
              <p className="text-sm text-muted-foreground">Imprimir ticket automaticamente al confirmar venta</p>
            </div>
            <Switch
              checked={config.autoPrint}
              onCheckedChange={(v) => set({ autoPrint: v })}
              disabled={!isTauri}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Cortar papel</Label>
              <p className="text-sm text-muted-foreground">Corte automatico despues de imprimir</p>
            </div>
            <Switch
              checked={config.autoCut}
              onCheckedChange={(v) => set({ autoCut: v })}
              disabled={!isTauri}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Abrir cajon</Label>
              <p className="text-sm text-muted-foreground">Abrir cajon de dinero al finalizar venta</p>
            </div>
            <Switch
              checked={config.openDrawer}
              onCheckedChange={(v) => set({ openDrawer: v })}
              disabled={!isTauri}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prueba</CardTitle>
          <CardDescription>Enviar ticket de prueba a la impresora</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button onClick={handleTest} disabled={isPrinting}>
              {isPrinting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Printer className="h-4 w-4 mr-2" />}
              Imprimir Prueba
            </Button>
            {testResult === "success" && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Impreso OK
              </Badge>
            )}
            {testResult === "error" && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" /> Error al imprimir
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
