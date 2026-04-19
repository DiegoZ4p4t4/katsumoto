import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSunatConfig, useSunatMutations } from "@/hooks/useSunatConfig";
import type { SunatConfigFormData } from "@/lib/types";
import { PERU_DEPARTMENTS, getProvincesForDepartment, getDistrictsForProvince, getDepartmentName, getProvinceName } from "@/lib/geo-peru";
import type { GeoProvince, GeoDistrict } from "@/lib/types";
import { ShieldCheck, Loader2, Upload, Wifi, WifiOff, AlertCircle, Trash2, FileKey, CheckCircle2, Circle, Search, KeyRound } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { queryRuc } from "@/services/apisPeru";

const emptyForm: SunatConfigFormData = {
  ruc: "",
  razon_social: "",
  nombre_comercial: "",
  ubigeo: "",
  departamento: "",
  provincia: "",
  distrito: "",
  direccion: "",
  usuario_sol: "",
  clave_sol: "",
  certificado_path: null,
  certificado_password: null,
  modo_produccion: false,
};

export default function SunatConfig() {
  const { config, isLoading } = useSunatConfig();
  const {
    saveConfig, isSaving,
    testConnection, isTesting, testResult,
    uploadCertificate, isUploading,
  } = useSunatMutations();

  const [local, setLocal] = useState<SunatConfigFormData>(emptyForm);
  const [pendingCertSave, setPendingCertSave] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [rucLookupLoading, setRucLookupLoading] = useState(false);
  const [rucLookupDone, setRucLookupDone] = useState(false);
  const lastRucLookupRef = useRef("");

  const handleRucLookup = useCallback(async (ruc: string) => {
    const digits = ruc.replace(/\D/g, "");
    if (digits.length !== 11 || digits === lastRucLookupRef.current) return;
    lastRucLookupRef.current = digits;
    setRucLookupLoading(true);
    setRucLookupDone(false);
    try {
      const data = await queryRuc(digits);
      const updates: Partial<SunatConfigFormData> = {};
      if (data.razonSocial) updates.razon_social = data.razonSocial;
      if (data.nombreComercial) updates.nombre_comercial = data.nombreComercial;
      if (data.direccion) updates.direccion = data.direccion;
      if (data.departamento) updates.departamento = data.departamento;
      if (data.provincia) updates.provincia = data.provincia;
      if (data.distrito) updates.distrito = data.distrito;
      if (data.ubigeo) updates.ubigeo = data.ubigeo;
      if (data.ubigeo) {
        const deptCode = data.ubigeo.substring(0, 2);
        const provCode = data.ubigeo.substring(0, 4);
        setGeoDeptCode(deptCode);
        setGeoProvCode(provCode);
      }
      setLocal((l) => ({ ...l, ...updates }));
      setRucLookupDone(true);
    } catch {
      lastRucLookupRef.current = "";
    } finally {
      setRucLookupLoading(false);
    }
  }, []);

  const certFileName = local.certificado_path
    ? local.certificado_path.split("/").pop() ?? "cert"
    : null;

  const [geoDeptCode, setGeoDeptCode] = useState("");
  const [geoProvCode, setGeoProvCode] = useState("");

  const provinces: GeoProvince[] = useMemo(() => geoDeptCode ? getProvincesForDepartment(geoDeptCode) : [], [geoDeptCode]);
  const districts: GeoDistrict[] = useMemo(() => geoProvCode ? getDistrictsForProvince(geoProvCode) : [], [geoProvCode]);

  useEffect(() => {
    if (config) {
      const ubigeo = config.ubigeo || "";
      const deptCode = ubigeo.substring(0, 2);
      const provCode = ubigeo.substring(0, 4);
      setGeoDeptCode(deptCode);
      setGeoProvCode(provCode);
      setLocal({
        ruc: config.ruc || "",
        razon_social: config.razon_social || "",
        nombre_comercial: config.nombre_comercial || "",
        ubigeo: config.ubigeo || "",
        departamento: config.departamento || "",
        provincia: config.provincia || "",
        distrito: config.distrito || "",
        direccion: config.direccion || "",
        usuario_sol: config.usuario_sol || "",
        clave_sol: "",
        certificado_path: config.certificado_path || null,
        certificado_password: null,
        modo_produccion: config.modo_produccion || false,
      });
    }
  }, [config]);

  const hasChanges = (() => {
    if (!config) return local.ruc !== "" || local.razon_social !== "";
    return (
      config.ruc !== local.ruc ||
      config.razon_social !== local.razon_social ||
      config.nombre_comercial !== local.nombre_comercial ||
      config.ubigeo !== local.ubigeo ||
      config.departamento !== local.departamento ||
      config.provincia !== local.provincia ||
      config.distrito !== local.distrito ||
      config.direccion !== local.direccion ||
      config.usuario_sol !== local.usuario_sol ||
      local.clave_sol !== "" ||
      (local.certificado_password !== null && local.certificado_password !== "") ||
      config.modo_produccion !== local.modo_produccion ||
      config.certificado_path !== local.certificado_path
    );
  })();

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    const path = await uploadCertificate(file);
    if (path) {
      setLocal((l) => ({ ...l, certificado_path: path }));
      setPendingCertSave(true);
    }
  };

  const handleDeleteCert = () => {
    setLocal((l) => ({ ...l, certificado_path: null, certificado_password: null }));
    setPendingCertSave(true);
  };

  const handleSelectDept = (deptCode: string) => {
    setGeoDeptCode(deptCode);
    setGeoProvCode("");
    const deptName = getDepartmentName(deptCode);
    setLocal(l => ({ ...l, departamento: deptName, provincia: "", distrito: "", ubigeo: "" }));
  };

  const handleSelectProv = (provCode: string) => {
    setGeoProvCode(provCode);
    const provName = getProvinceName(provCode);
    setLocal(l => ({ ...l, provincia: provName, distrito: "", ubigeo: "" }));
  };

  const handleSelectDistrict = (distCode: string) => {
    const dist = districts.find(d => d.code === distCode);
    setLocal(l => ({ ...l, distrito: dist?.name || "", ubigeo: distCode }));
  };

  const handleSave = () => {
    saveConfig(local);
    setPendingCertSave(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
          <ShieldCheck className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Configuración SUNAT</h1>
          <p className="text-sm text-muted-foreground">
            Credenciales para emisión de comprobantes electrónicos
          </p>
        </div>
      </div>

      {config?.is_configured ? (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
            SUNAT configurado
          </span>
          <Badge variant="outline" className="ml-2 text-xs">
            {config.modo_produccion ? "Producción" : "Beta (pruebas)"}
          </Badge>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            Complete las credenciales para habilitar la facturación electrónica
          </span>
        </div>
      )}

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-5">
          <h2 className="font-semibold text-lg">Datos del Emisor</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>RUC *</Label>
              <div className="relative">
                <Input
                  placeholder="20123456789"
                  value={local.ruc}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                    setLocal({ ...local, ruc: val });
                    setRucLookupDone(false);
                    if (val.length === 11) handleRucLookup(val);
                  }}
                  className={`rounded-xl pr-9 ${rucLookupDone ? "border-emerald-400 dark:border-emerald-600" : ""}`}
                  maxLength={11}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {rucLookupLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  ) : rucLookupDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Search className="w-4 h-4 text-muted-foreground" />
                  )}
                </span>
              </div>
              {rucLookupDone && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Datos autocompletados desde SUNAT
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Razón Social *</Label>
              <Input
                placeholder="MI EMPRESA SAC"
                value={local.razon_social}
                onChange={(e) => setLocal({ ...local, razon_social: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nombre Comercial</Label>
            <Input
              placeholder="Nombre comercial (opcional)"
              value={local.nombre_comercial}
              onChange={(e) => setLocal({ ...local, nombre_comercial: e.target.value })}
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-5">
          <h2 className="font-semibold text-lg">Ubicación Fiscal</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select value={geoDeptCode} onValueChange={handleSelectDept}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {PERU_DEPARTMENTS.map(dept => (
                    <SelectItem key={dept.code} value={dept.code}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Provincia</Label>
              <Select value={geoProvCode} onValueChange={handleSelectProv} disabled={!geoDeptCode}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={geoDeptCode ? "Seleccionar..." : "Primero dept."} />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {provinces.map(prov => (
                    <SelectItem key={prov.code} value={prov.code}>{prov.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Distrito</Label>
              <Select value={local.ubigeo || ""} onValueChange={handleSelectDistrict} disabled={!geoProvCode}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={geoProvCode ? "Seleccionar..." : "Primero prov."} />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {districts.map(dist => (
                    <SelectItem key={dist.code} value={dist.code}>{dist.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ubigeo (6 dígitos)</Label>
              <Input
                value={local.ubigeo}
                className="rounded-xl bg-muted/50"
                readOnly
                placeholder="Se completa al elegir distrito"
              />
            </div>
            <div className="space-y-2">
              <Label>Dirección *</Label>
              <Input
                placeholder="Av. Ejemplo 123"
                value={local.direccion}
                onChange={(e) => setLocal({ ...local, direccion: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-5">
          <h2 className="font-semibold text-lg">Credenciales SOL</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Usuario SOL *</Label>
              <Input
                placeholder="MODDATOS"
                value={local.usuario_sol}
                onChange={(e) => setLocal({ ...local, usuario_sol: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Clave SOL *</Label>
              <Input
                type="password"
                placeholder={config?.has_clave_sol ? "Dejar vacío para mantener la actual" : "••••••••"}
                value={local.clave_sol}
                onChange={(e) => setLocal({ ...local, clave_sol: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-5">
          <h2 className="font-semibold text-lg">Certificado Digital</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => fileRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isUploading ? "Subiendo..." : "Subir Certificado (.pem / .p12 / .pfx)"}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".pem,.p12,.pfx"
                className="hidden"
                onChange={handleCertUpload}
              />
              {certFileName && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <FileKey className="w-3 h-3" />
                    {certFileName}
                  </Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>Eliminar certificado</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Está seguro de eliminar el certificado digital? Deberá guardar la configuración para aplicar el cambio.
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCert}>Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
              {pendingCertSave && (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  Pendiente guardar
                </span>
              )}
            </div>
            {(local.certificado_path?.endsWith(".p12") || local.certificado_path?.endsWith(".pfx")) && (
              <div className="space-y-2">
                <Label>Contraseña del Certificado (PKCS#12)</Label>
                <Input
                  type="password"
                  placeholder={config?.has_certificado_password ? "Dejar vacío para mantener la actual" : "Solo si es .p12/.pfx"}
                  value={local.certificado_password || ""}
                  onChange={(e) => setLocal({ ...local, certificado_password: e.target.value || null })}
                  className="rounded-xl max-w-xs"
                />
              </div>
            )}
            <div className="pt-2 space-y-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => testConnection()}
                disabled={isTesting || !local.certificado_path || !config?.is_configured}
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : testResult?.success ? (
                  <KeyRound className="w-4 h-4 mr-2 text-emerald-600" />
                ) : (
                  <KeyRound className="w-4 h-4 mr-2" />
                )}
                {isTesting ? "Validando..." : "Validar Certificado"}
              </Button>
              {!config?.is_configured && local.certificado_path && (
                <p className="text-xs text-amber-600 dark:text-amber-400">Guarde la configuración primero para validar el certificado.</p>
              )}
              {testResult && local.certificado_path && (
                <div className={`p-3 rounded-xl border text-sm ${
                  testResult.success
                    ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                    : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                }`}>
                  {testResult.success ? (
                    <div className="space-y-1">
                      <p className="font-medium text-emerald-700 dark:text-emerald-300">Certificado válido</p>
                      {(testResult as any).result?.certificate_subject && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">Subject: {(testResult as any).result.certificate_subject}</p>
                      )}
                      {(testResult as any).result?.certificate_not_after && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">Vence: {new Date((testResult as any).result.certificate_not_after).toLocaleDateString("es-PE")}</p>
                      )}
                      {(testResult as any).result?.digest_value && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">Hash: {(testResult as any).result.digest_value.substring(0, 16)}...</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-medium text-red-700 dark:text-red-300">Certificado inválido</p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {testResult.error_message?.includes("RUC no corresponde") ? "El certificado no pertenece al RUC configurado." :
                         testResult.error_message?.includes("expirado") ? "El certificado ha caducado." :
                         testResult.error_message?.includes("Clave") || testResult.error_message?.includes("incorrecta") ? "La contraseña del certificado es incorrecta." :
                         testResult.error_message?.includes("no se encuentra") ? "El archivo no se encuentra en Storage. Suba el certificado nuevamente." :
                         testResult.error_message || "No se pudo validar el certificado."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-5">
          <h2 className="font-semibold text-lg">Modo de Operación</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Modo Producción</p>
              <p className="text-sm text-muted-foreground">
                {local.modo_produccion
                  ? "Envío real a SUNAT. Los comprobantes tienen validez fiscal."
                  : "Modo beta (pruebas). Los comprobantes NO tienen validez fiscal."}
              </p>
            </div>
            <Switch
              checked={local.modo_produccion}
              onCheckedChange={(checked) => setLocal({ ...local, modo_produccion: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-3">
          <h2 className="font-semibold text-lg">Estado de Configuración</h2>
          <div className="space-y-2">
            {([
              { label: "RUC configurado", done: !!local.ruc },
              { label: "Razón social configurada", done: !!local.razon_social },
              { label: "Credenciales SOL configuradas", done: !!(local.usuario_sol && (config?.has_clave_sol || local.clave_sol)) },
              { label: "Certificado digital cargado", done: !!local.certificado_path },
              { label: "Dirección fiscal configurada", done: !!local.direccion },
              { label: "Modo seleccionado", done: true },
            ]).map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                {item.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Circle className="w-4 h-4 text-amber-500" />
                )}
                <span className={item.done ? "" : "text-amber-600 dark:text-amber-400"}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => testConnection()}
          disabled={isTesting || !config?.is_configured}
        >
          {isTesting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : testResult?.success ? (
            <Wifi className="w-4 h-4 mr-2 text-emerald-600" />
          ) : testResult && !testResult.success ? (
            <WifiOff className="w-4 h-4 mr-2 text-red-500" />
          ) : (
            <Wifi className="w-4 h-4 mr-2" />
          )}
          {isTesting ? "Probando..." : "Probar Conexión"}
        </Button>

        <Button
          className="rounded-xl bg-orange-600 hover:bg-orange-700"
          onClick={handleSave}
          disabled={isSaving || (!hasChanges && !pendingCertSave)}
        >
          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isSaving ? "Guardando..." : pendingCertSave ? "Guardar para aplicar certificado" : "Guardar Configuración"}
        </Button>
      </div>

      {testResult && (
        <div
          className={`p-3 rounded-xl border ${
            testResult.success
              ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
              : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              testResult.success
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-red-700 dark:text-red-300"
            }`}
          >
            {testResult.success
              ? "Conexión exitosa con SUNAT"
              : `Error: ${testResult.error_message || "No se pudo conectar"}`}
          </p>
          {!testResult.success && testResult.error_message && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {testResult.error_message.includes("RUC no corresponde") ? "Verifique que el certificado digital pertenezca al RUC configurado." :
               testResult.error_message.includes("expirado") ? "El certificado ha caducado. Renuévelo en SUNAT y suba el nuevo certificado." :
               testResult.error_message.includes("Clave") || testResult.error_message.includes("incorrecta") ? "La contraseña del certificado es incorrecta. Verifique e ingrese la contraseña correcta." :
               testResult.error_message.includes("certificado") || testResult.error_message.includes("Falta") ? "Suba un certificado digital válido en la sección de Certificado Digital." :
               "Verifique sus credenciales SOL y la configuración general."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
