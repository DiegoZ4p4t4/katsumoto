import { useState, useEffect, useCallback, useRef } from "react";
import { queryRuc, queryDni } from "@/services/apisPeru";
import { Input } from "@/components/ui/input";
import { Search, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export interface LookupResult {
  documentType: "RUC" | "DNI";
  documentNumber: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  email?: string;
  department_code?: string;
  province_code?: string;
  district_code?: string;
}

interface CustomerLookupProps {
  onResult: (data: LookupResult) => void;
  mode?: "RUC" | "DNI" | "auto";
  placeholder?: string;
  compact?: boolean;
  className?: string;
}

export function CustomerLookup({
  onResult,
  mode = "auto",
  placeholder,
  compact = false,
  className = "",
}: CustomerLookupProps) {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [found, setFound] = useState<LookupResult | null>(null);
  const lastQueried = useRef("");
  const mountedRef = useRef(true);
  const versionRef = useRef(0);

  // Track mounted state to prevent updates after unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Limpiar todo cuando cambie el modo (Factura ↔ Boleta)
  useEffect(() => {
    versionRef.current += 1;
    setInputValue("");
    setError("");
    setFound(null);
    lastQueried.current = "";
  }, [mode]);

  const maxLength = mode === "DNI" ? 8 : mode === "RUC" ? 11 : 11;

  const defaultPlaceholder =
    mode === "RUC"
      ? "Consultar RUC (11 dígitos)..."
      : mode === "DNI"
        ? "Consultar DNI (8 dígitos)..."
        : "Consultar RUC o DNI...";

  const doLookup = useCallback(
    async (val: string, version: number) => {
      const digits = val.replace(/\D/g, "");

      let type: "RUC" | "DNI" | null = null;
      let shouldQuery = false;

      if (mode === "RUC" && digits.length === 11) {
        type = "RUC";
        shouldQuery = true;
      } else if (mode === "DNI" && digits.length === 8) {
        type = "DNI";
        shouldQuery = true;
      } else if (mode === "auto") {
        if (digits.length === 11) {
          type = "RUC";
          shouldQuery = true;
        } else if (digits.length === 8) {
          type = "DNI";
          shouldQuery = true;
        }
      }

      if (!shouldQuery || !type) return;
      if (digits === lastQueried.current) return;
      lastQueried.current = digits;

      setLoading(true);
      setError("");
      setFound(null);

      try {
        let result: LookupResult;
        if (type === "RUC") {
          const data = await queryRuc(digits);
          // Abort if mode changed or component unmounted
          if (!mountedRef.current || version !== versionRef.current) return;
          result = {
            documentType: "RUC",
            documentNumber: data.ruc,
            name: data.razonSocial,
            phone: data.telefonos?.[0] || undefined,
            address: data.direccion || undefined,
            city: data.departamento || undefined,
            department_code: data.ubigeo?.slice(0, 2) || undefined,
            province_code: data.ubigeo?.slice(0, 4) || undefined,
            district_code: data.ubigeo || undefined,
          };
        } else {
          const data = await queryDni(digits);
          // Abort if mode changed or component unmounted
          if (!mountedRef.current || version !== versionRef.current) return;
          result = {
            documentType: "DNI",
            documentNumber: data.dni,
            name: `${data.apellidoPaterno} ${data.apellidoMaterno}, ${data.nombres}`,
          };
        }

        // Double-check before applying results
        if (!mountedRef.current || version !== versionRef.current) return;

        setFound(result);
        onResult(result);
      } catch (err: unknown) {
        if (!mountedRef.current || version !== versionRef.current) return;
        setError(err instanceof Error ? err.message : "Error al consultar");
      } finally {
        if (mountedRef.current && version === versionRef.current) {
          setLoading(false);
        }
      }
    },
    [mode, onResult],
  );

  useEffect(() => {
    const digits = inputValue.replace(/\D/g, "");
    if (digits.length === 8 || digits.length === 11) {
      const currentVersion = versionRef.current;
      const timer = setTimeout(() => doLookup(inputValue, currentVersion), 600);
      return () => clearTimeout(timer);
    }
    setError("");
    setFound(null);
  }, [inputValue, doLookup]);

  return (
    <div className={className}>
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder || defaultPlaceholder}
          className={`pl-8 pr-8 ${compact ? "h-8 text-[11px] rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700" : "h-9 text-sm rounded-xl"}`}
          maxLength={maxLength}
        />
        {loading && (
          <Loader2 className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-orange-500" />
        )}
      </div>

      {error && (
        <p
          className={`text-red-500 flex items-center gap-1 mt-1 ${
            compact ? "text-[9px]" : "text-[10px]"
          }`}
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}

      {found && !error && (
        <div className="mt-1.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span
              className={`font-semibold text-emerald-700 dark:text-emerald-400 truncate ${
                compact ? "text-[10px]" : "text-xs"
              }`}
            >
              {found.name}
            </span>
          </div>
          {found.address && (
            <p
              className={`text-emerald-600 dark:text-emerald-400/70 truncate pl-[18px] mt-0.5 ${
                compact ? "text-[9px]" : "text-[10px]"
              }`}
            >
              {found.address}
            </p>
          )}
        </div>
      )}
    </div>
  );
}