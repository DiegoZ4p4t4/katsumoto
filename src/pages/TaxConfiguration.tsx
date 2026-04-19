import { useState, useMemo } from "react";
import { useTaxConfig } from "@/lib/tax-config-context";
import {
  getDepartments,
  getProvincesForDepartment,
  getDistrictsForProvince,
  getProvince,
  getDepartment,
  getGeoStats,
} from "@/lib/geo-peru";
import {
  getApplicableTaxRules,
  getLegalBasisText,
  determineTax,
  validateTaxConfig,
} from "@/lib/tax-engine";
import { TAX_AFFECTATION_TYPES } from "@/lib/constants";
import type { TaxAffectation } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Scale,
  MapPin,
  CheckCircle,
  AlertTriangle,
  FileText,
  TreePine,
  Building2,
  Info,
  TrendingDown,
  BookOpen,
  Zap,
  Loader2,
  Save,
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

type LocalConfig = {
  departmentCode: string;
  provinceCode: string;
  districtCode: string;
  selvaLawEnabled: boolean;
  defaultTaxAffectation: TaxAffectation;
  legalTextTemplate: string;
};

export default function TaxConfiguration() {
  const { taxConfig, isLoading, saveConfig } = useTaxConfig();

  const [local, setLocal] = useState<LocalConfig>({
    departmentCode: taxConfig.sellerDepartmentCode || "",
    provinceCode: taxConfig.sellerProvinceCode || "",
    districtCode: taxConfig.sellerDistrictCode || "",
    selvaLawEnabled: taxConfig.selvaLawEnabled ?? true,
    defaultTaxAffectation: taxConfig.defaultTaxAffectation ?? "gravado",
    legalTextTemplate: taxConfig.legalTextTemplate || "",
  });

  const [saving, setSaving] = useState(false);

  const departments = useMemo(() => getDepartments(), []);
  const provinces = useMemo(
    () =>
      local.departmentCode
        ? getProvincesForDepartment(local.departmentCode)
        : [],
    [local.departmentCode]
  );
  const districts = useMemo(
    () =>
      local.provinceCode ? getDistrictsForProvince(local.provinceCode) : [],
    [local.provinceCode]
  );

  const selectedProvince = useMemo(
    () => (local.provinceCode ? getProvince(local.provinceCode) : null),
    [local.provinceCode]
  );

  const selectedDepartment = useMemo(
    () =>
      local.departmentCode ? getDepartment(local.departmentCode) : null,
    [local.departmentCode]
  );

  const selectedDistrict = useMemo(() => {
    if (!local.districtCode || !districts.length) return null;
    return districts.find((d) => d.code === local.districtCode) ?? null;
  }, [local.districtCode, districts]);

  const isSelva = useMemo(() => {
    if (selectedDistrict) return selectedDistrict.isSelva;
    return selectedProvince?.isSelva ?? false;
  }, [selectedDistrict, selectedProvince]);

  const isPartialSelvaProvince =
    selectedProvince?.isSelva &&
    !selectedDepartment?.isAllSelva &&
    districts.length > 0;

  const applicableRules = useMemo(
    () =>
      getApplicableTaxRules(
        local.provinceCode,
        local.districtCode,
        local.selvaLawEnabled
      ),
    [local.provinceCode, local.districtCode, local.selvaLawEnabled]
  );

  const sampleDetermination = useMemo(
    () =>
      local.provinceCode
        ? determineTax({
            sellerProvinceCode: local.provinceCode,
            sellerDistrictCode: local.districtCode || undefined,
            buyerLocationCode: local.departmentCode,
            buyerLocationLevel: "department",
            productFamily: "productos",
            selvaLawEnabled: local.selvaLawEnabled,
          })
        : null,
    [local]
  );

  const legalBasisText = useMemo(
    () =>
      sampleDetermination && local.provinceCode
        ? getLegalBasisText(
            sampleDetermination,
            local.provinceCode,
            local.districtCode || undefined
          )
        : null,
    [sampleDetermination, local.provinceCode, local.districtCode]
  );

  const geoStats = useMemo(() => getGeoStats(), []);

  const validation = useMemo(
    () =>
      local.provinceCode
        ? validateTaxConfig({
            sellerDepartmentCode: local.departmentCode,
            sellerProvinceCode: local.provinceCode,
            sellerDistrictCode: local.districtCode,
            sellerIsSelva: isSelva,
            selvaLawEnabled: local.selvaLawEnabled,
          })
        : null,
    [local, isSelva]
  );

  const hasChanges =
    (taxConfig.sellerDepartmentCode || "") !== local.departmentCode ||
    (taxConfig.sellerProvinceCode || "") !== local.provinceCode ||
    (taxConfig.sellerDistrictCode || "") !== local.districtCode ||
    (taxConfig.selvaLawEnabled ?? true) !== local.selvaLawEnabled ||
    (taxConfig.defaultTaxAffectation ?? "gravado") !==
      local.defaultTaxAffectation ||
    (taxConfig.legalTextTemplate || "") !== local.legalTextTemplate;

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveConfig({
        sellerDepartmentCode: local.departmentCode,
        sellerProvinceCode: local.provinceCode,
        sellerDistrictCode: local.districtCode,
        sellerIsSelva: isSelva,
        selvaLawEnabled: local.selvaLawEnabled,
        defaultTaxAffectation: local.defaultTaxAffectation,
        legalTextTemplate: local.legalTextTemplate || null,
      });
      showSuccess("Configuración tributaria guardada");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      showError("Error al guardar: " + msg);
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center gap-2">
        <Scale className="w-7 h-7 text-orange-600 dark:text-orange-400" />
        <h1 className="text-2xl md:text-3xl font-bold">
          Configuración Tributaria
        </h1>
      </div>
      <p className="text-sm text-muted-foreground -mt-4">
        Define la ubicación de tu negocio para determinar las reglas fiscales
        aplicables según la legislación peruana.
      </p>

      {taxConfig.sellerProvinceCode && (
        <div
          className={`p-4 rounded-2xl border-2 ${
            taxConfig.sellerIsSelva
              ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700"
              : "bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                taxConfig.sellerIsSelva
                  ? "bg-emerald-100 dark:bg-emerald-800/40"
                  : "bg-blue-100 dark:bg-blue-800/40"
              }`}
            >
              {taxConfig.sellerIsSelva ? (
                <TreePine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">
                {taxConfig.sellerIsSelva
                  ? "Zona de Amazonía — Exoneración IGV activa"
                  : "Régimen General — IGV 18%"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {getProvince(taxConfig.sellerProvinceCode)?.name || "—"},{" "}
                {getDepartment(taxConfig.sellerDepartmentCode)?.name || "—"}
                {taxConfig.selvaLawEnabled &&
                  taxConfig.sellerIsSelva &&
                  " · Ley 27037 habilitada"}
              </p>
            </div>
            <Badge
              className={`rounded-lg text-[10px] font-bold ${
                taxConfig.sellerIsSelva
                  ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-800/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                  : "bg-blue-200 text-blue-800 dark:bg-blue-800/60 dark:text-blue-300 border-blue-300 dark:border-blue-700"
              }`}
            >
              {taxConfig.sellerIsSelva ? "SELVA" : "GENERAL"}
            </Badge>
          </div>
        </div>
      )}

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h2 className="text-lg font-bold">Ubicación del Negocio</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Selecciona departamento, provincia y distrito. La granularidad a
            nivel distrito mejora la precisión de la determinación tributaria.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Departamento</Label>
              <Select
                value={local.departmentCode}
                onValueChange={(v) =>
                  setLocal({
                    ...local,
                    departmentCode: v,
                    provinceCode: "",
                    districtCode: "",
                  })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Departamento..." />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.code} value={dept.code}>
                      <span className="flex items-center gap-2">
                        {dept.isAllSelva && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        )}
                        {dept.name}
                        {dept.isAllSelva && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-auto">
                            Selva
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Provincia</Label>
              <Select
                value={local.provinceCode}
                onValueChange={(v) =>
                  setLocal({ ...local, provinceCode: v, districtCode: "" })
                }
                disabled={!local.departmentCode}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Provincia..." />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((prov) => (
                    <SelectItem key={prov.code} value={prov.code}>
                      <span className="flex items-center gap-2">
                        {prov.isSelva && (
                          <TreePine className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        )}
                        {prov.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Distrito
                {isPartialSelvaProvince && (
                  <span className="text-[10px] ml-1 text-amber-600 dark:text-amber-400 font-normal">
                    (recomendado)
                  </span>
                )}
              </Label>
              <Select
                value={local.districtCode}
                onValueChange={(v) =>
                  setLocal({ ...local, districtCode: v })
                }
                disabled={!local.provinceCode || districts.length === 0}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue
                    placeholder={
                      districts.length > 0
                        ? "Distrito..."
                        : "Sin datos de distrito"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((dist) => (
                    <SelectItem key={dist.code} value={dist.code}>
                      <span className="flex items-center gap-2">
                        {dist.isSelva ? (
                          <TreePine className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        ) : (
                          <Building2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        )}
                        {dist.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedProvince && (
            <div
              className={`p-4 rounded-xl border ${
                isSelva
                  ? isPartialSelvaProvince
                    ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                    : "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                  : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3">
                {isSelva ? (
                  isPartialSelvaProvince ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  )
                ) : (
                  <Info className="w-5 h-5 text-slate-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {isSelva
                      ? isPartialSelvaProvince
                        ? selectedDistrict
                          ? selectedDistrict.isSelva
                            ? "Distrito en zona de Amazonía"
                            : "Distrito fuera de zona de Amazonía"
                          : "Provincia con zona parcial de Amazonía"
                        : "Provincia en zona de Amazonía"
                      : "Provincia fuera de zona de Amazonía"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isSelva
                      ? isPartialSelvaProvince
                        ? "Esta provincia tiene distritos dentro y fuera de la Amazonía. Selecciona tu distrito para mayor precisión."
                        : "Toda la provincia se considera zona de Amazonía según la Ley 27037."
                      : "El IGV general del 18% aplica para todas las operaciones."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedProvince && isSelva && (
            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <div>
                  <p className="text-sm font-semibold">
                    Habilitar exoneración por Amazonía
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Activa la detección automática de exoneración IGV según Ley
                    27037
                  </p>
                </div>
              </div>
              <Switch
                checked={local.selvaLawEnabled}
                onCheckedChange={(v) =>
                  setLocal({ ...local, selvaLawEnabled: v })
                }
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Afectación por defecto (productos nuevos)
              </Label>
              <Select
                value={local.defaultTaxAffectation}
                onValueChange={(v) =>
                  setLocal({
                    ...local,
                    defaultTaxAffectation: v as TaxAffectation,
                  })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(TAX_AFFECTATION_TYPES) as [
                      string,
                      (typeof TAX_AFFECTATION_TYPES)[TaxAffectation]
                    ][]
                  ).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span className="text-xs">{info.icon}</span>
                        {info.label} — {info.rate}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Texto legal personalizado para comprobantes
            </Label>
            <Textarea
              className="rounded-xl min-h-[60px] text-xs"
              placeholder="Ej: Exonerado del IGV conforme al Art. 12° de la Ley N° 27037..."
              value={local.legalTextTemplate}
              onChange={(e) =>
                setLocal({ ...local, legalTextTemplate: e.target.value })
              }
            />
            <p className="text-[10px] text-muted-foreground">
              Se usará este texto en los comprobantes emitidos. Si lo dejas
              vacío, se generará automáticamente.
            </p>
          </div>

          {validation && (validation.warnings.length > 0 || validation.errors.length > 0) && (
            <div className="space-y-2">
              {validation.errors.map((err, i) => (
                <div
                  key={`err-${i}`}
                  className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 dark:text-red-400">{err}</p>
                  </div>
                </div>
              ))}
              {validation.warnings.map((warn, i) => (
                <div
                  key={`warn-${i}`}
                  className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">{warn}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={
                !local.provinceCode ||
                !hasChanges ||
                saving ||
                (validation ? !validation.valid : false)
              }
              className="rounded-xl bg-orange-600 hover:bg-orange-700"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar Configuración
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h2 className="text-lg font-bold">Reglas Fiscales Aplicables</h2>
          </div>

          <div className="space-y-3">
            {applicableRules.map((rule) => {
              const taxInfo = TAX_AFFECTATION_TYPES[rule.affectation];
              return (
                <div
                  key={rule.id}
                  className={`p-4 rounded-xl border ${
                    rule.applicable
                      ? rule.affectation === "exonerado"
                        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                        : "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                      : "bg-muted/30 border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-sm font-bold">{rule.title}</p>
                        {rule.applicable ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 rounded-lg text-[9px]">
                            Aplica
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="rounded-lg text-[9px]"
                          >
                            No aplica
                          </Badge>
                        )}
                        {taxInfo && (
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-md font-bold border ${taxInfo.color}`}
                          >
                            {taxInfo.label} {taxInfo.rate}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {rule.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {rule.law}, {rule.article}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Condiciones
                    </p>
                    <div className="space-y-1">
                      {rule.conditions.map((cond, i) => (
                        <p
                          key={i}
                          className="text-[11px] text-muted-foreground leading-relaxed"
                        >
                          {cond}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {sampleDetermination && local.provinceCode && (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h2 className="text-lg font-bold">Simulación de Venta</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Resultado al vender un producto a un cliente en{" "}
              <strong>{selectedDepartment?.name}</strong> (misma zona):
            </p>

            <div
              className={`p-4 rounded-xl border-2 ${
                sampleDetermination.affectation === "exonerado"
                  ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700"
                  : "bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      sampleDetermination.affectation === "exonerado"
                        ? "bg-emerald-100 dark:bg-emerald-800/40"
                        : "bg-blue-100 dark:bg-blue-800/40"
                    }`}
                  >
                    <span className="text-xl font-extrabold">
                      {sampleDetermination.rate === 0 ? "0%" : "18%"}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">
                      {sampleDetermination.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Código SUNAT: {sampleDetermination.sunatCode}
                    </p>
                  </div>
                </div>
                <Badge
                  className={`rounded-lg font-bold ${
                    sampleDetermination.confidence === "high"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800"
                      : sampleDetermination.confidence === "medium"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800"
                  }`}
                >
                  {sampleDetermination.confidence === "high"
                    ? "Alta confianza"
                    : sampleDetermination.confidence === "medium"
                      ? "Requiere confirmación"
                      : "Baja confianza"}
                </Badge>
              </div>
              <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Justificación
                </p>
                <p className="text-xs text-foreground leading-relaxed">
                  {sampleDetermination.justification}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono mt-1">
                  Base legal: {sampleDetermination.law}
                </p>
              </div>
            </div>

            {legalBasisText && (
              <div className="p-3 bg-muted/40 rounded-xl border">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Texto legal para comprobantes
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  "{legalBasisText}"
                </p>
              </div>
            )}

            {sampleDetermination.confidence !== "high" && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      Requiere verificación contable
                    </p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400/80 mt-0.5">
                      La determinación automática es orientativa. Un contador
                      colegiado debe confirmar la procedencia de la exoneración.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h2 className="text-lg font-bold">Cobertura Geográfica</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl border border-orange-200 dark:border-orange-800">
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                Departamentos
              </p>
              <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
                {geoStats.totalDepartments}
              </p>
              <p className="text-[10px] text-muted-foreground">de 25</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Provincias
              </p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {geoStats.totalProvinces}
              </p>
              <p className="text-[10px] text-muted-foreground">mapeadas</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Zona Selva
              </p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {geoStats.selvaProvinces}
              </p>
              <p className="text-[10px] text-muted-foreground">
                provincias ({geoStats.selvaProvincesPercentage}%)
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground bg-muted/30 rounded-xl p-3">
            <p className="font-semibold mb-1.5">
              Distribución de departamentos:
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px]">
                {geoStats.totalSelvaDepartments} totalmente selva
              </Badge>
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800 rounded-lg text-[10px]">
                {geoStats.partialSelvaDepartments} parcialmente selva
              </Badge>
              <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 rounded-lg text-[10px]">
                {geoStats.nonSelvaDepartments} sin selva
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Disclaimer Legal
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400/80 leading-relaxed mt-1">
              Este sistema proporciona una determinación automática orientativa
              del régimen tributario aplicable. La información se basa en la Ley
              N° 27037, D.S. 007-99-ITINCI, D.S. 103-99-EF y D.S. 059-2023-EF.
              La clasificación geográfica a nivel provincial es una aproximación;
              la determinación exacta requiere verificación a nivel de distrito.{" "}
              <strong>Consulta siempre con un contador colegiado</strong> para
              confirmar la procedencia de cualquier beneficio tributario.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
