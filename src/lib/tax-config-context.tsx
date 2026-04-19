import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import {
  taxConfigService,
  type TaxConfigRow,
  type TaxConfigSaveData,
} from "@/services/tax-config.service";
import { useAuth } from "./auth-context";
import type { TaxAffectation, Customer } from "./types";
import { determineTaxForTransaction, type CustomerLocation, type ShippingLocation } from "./tax-engine";

export interface TaxConfig {
  id?: string;
  branchId?: string | null;
  sellerDepartmentCode: string;
  sellerProvinceCode: string;
  sellerDistrictCode: string;
  sellerIsSelva: boolean;
  selvaLawEnabled: boolean;
  defaultTaxAffectation: TaxAffectation;
  legalTextTemplate: string | null;
}

const defaultConfig: TaxConfig = {
  sellerDepartmentCode: "",
  sellerProvinceCode: "",
  sellerDistrictCode: "",
  sellerIsSelva: false,
  selvaLawEnabled: true,
  defaultTaxAffectation: "gravado",
  legalTextTemplate: null,
};

function rowToConfig(row: TaxConfigRow): TaxConfig {
  return {
    id: row.id,
    branchId: row.branch_id,
    sellerDepartmentCode: row.seller_department_code,
    sellerProvinceCode: row.seller_province_code,
    sellerDistrictCode: row.seller_district_code,
    sellerIsSelva: row.seller_is_selva,
    selvaLawEnabled: row.selva_law_enabled,
    defaultTaxAffectation: row.default_tax_affectation,
    legalTextTemplate: row.legal_text_template,
  };
}

interface TaxConfigContextType {
  taxConfig: TaxConfig;
  isLoading: boolean;
  saveConfig: (config: TaxConfig) => Promise<void>;
  activeBranchTax: TaxConfig | null;
  branchConfigs: Map<string, TaxConfig>;
  loadBranchConfig: (branchId: string) => Promise<TaxConfig | null>;
  saveBranchConfig: (branchId: string, config: TaxConfig) => Promise<void>;
  determineTaxForSale: (
    customer?: Customer | null,
    shippingUbigeo?: { departmentCode: string; provinceCode: string; districtCode: string },
    branchData?: { department_code: string; province_code: string; district_code: string; is_selva_zone: boolean },
    isInPerson?: boolean,
  ) => ReturnType<typeof determineTaxForTransaction>;
}

const TaxConfigContext = createContext<TaxConfigContextType | null>(null);

export function TaxConfigProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [taxConfig, setTaxConfig] = useState<TaxConfig>(defaultConfig);
  const [activeBranchTax, setActiveBranchTax] = useState<TaxConfig | null>(null);
  const [branchConfigs, setBranchConfigs] = useState<Map<string, TaxConfig>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!user?.organization_id) {
      setIsLoading(false);
      return;
    }

    taxConfigService
      .getByOrg(user.organization_id)
      .then((row) => {
        if (mountedRef.current) {
          setTaxConfig(row ? rowToConfig(row) : defaultConfig);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      });

    taxConfigService
      .getAllForOrg(user.organization_id)
      .then((rows) => {
        if (mountedRef.current) {
          const map = new Map<string, TaxConfig>();
          for (const row of rows) {
            if (row.branch_id) {
              map.set(row.branch_id, rowToConfig(row));
            }
          }
          setBranchConfigs(map);
        }
      })
      .catch(() => {});

    return () => {
      mountedRef.current = false;
    };
  }, [user?.organization_id]);

  const saveConfig = useCallback(
    async (config: TaxConfig) => {
      if (!user?.organization_id) return;

      const data: TaxConfigSaveData = {
        seller_department_code: config.sellerDepartmentCode,
        seller_province_code: config.sellerProvinceCode,
        seller_district_code: config.sellerDistrictCode,
        seller_is_selva: config.sellerIsSelva,
        selva_law_enabled: config.selvaLawEnabled,
        default_tax_affectation: config.defaultTaxAffectation,
        legal_text_template: config.legalTextTemplate,
      };

      const row = await taxConfigService.upsert(user.organization_id, data);
      if (mountedRef.current) {
        setTaxConfig(rowToConfig(row));
      }
    },
    [user?.organization_id]
  );

  const loadBranchConfig = useCallback(
    async (branchId: string): Promise<TaxConfig | null> => {
      if (!user?.organization_id) return null;
      const row = await taxConfigService.getForBranch(branchId, user.organization_id);
      if (!row) return null;
      const config = rowToConfig(row);
      if (mountedRef.current) {
        setBranchConfigs((prev) => {
          const next = new Map(prev);
          next.set(branchId, config);
          return next;
        });
        setActiveBranchTax(config);
      }
      return config;
    },
    [user?.organization_id]
  );

  const saveBranchConfig = useCallback(
    async (branchId: string, config: TaxConfig) => {
      if (!user?.organization_id) return;

      const data: TaxConfigSaveData = {
        seller_department_code: config.sellerDepartmentCode,
        seller_province_code: config.sellerProvinceCode,
        seller_district_code: config.sellerDistrictCode,
        seller_is_selva: config.sellerIsSelva,
        selva_law_enabled: config.selvaLawEnabled,
        default_tax_affectation: config.defaultTaxAffectation,
        legal_text_template: config.legalTextTemplate,
      };

      const row = await taxConfigService.upsertForBranch(branchId, user.organization_id, data);
      const saved = rowToConfig(row);
      if (mountedRef.current) {
        setBranchConfigs((prev) => {
          const next = new Map(prev);
          next.set(branchId, saved);
          return next;
        });
        setActiveBranchTax(saved);
      }
    },
    [user?.organization_id]
  );

  const determineTaxForSale = useCallback(
    (
      customer?: Customer | null,
      shippingUbigeo?: { departmentCode: string; provinceCode: string; districtCode: string },
      branchData?: { department_code: string; province_code: string; district_code: string; is_selva_zone: boolean },
      isInPerson?: boolean,
    ) => {
      const config = activeBranchTax || taxConfig;
      const branch = branchData || {
        department_code: config.sellerDepartmentCode,
        province_code: config.sellerProvinceCode,
        district_code: config.sellerDistrictCode,
        is_selva_zone: config.sellerIsSelva,
      };

      const customerLoc: CustomerLocation | undefined = customer
        ? {
            department_code: customer.department_code || "",
            province_code: customer.province_code || "",
            district_code: customer.district_code || "",
            is_selva_zone: customer.is_selva_zone,
          }
        : undefined;

      const shippingLoc: ShippingLocation | undefined = shippingUbigeo
        ? {
            department_code: shippingUbigeo.departmentCode,
            province_code: shippingUbigeo.provinceCode,
            district_code: shippingUbigeo.districtCode,
          }
        : undefined;

      return determineTaxForTransaction({
        branch,
        selvaLawEnabled: config.selvaLawEnabled,
        customer: customerLoc,
        shipping: shippingLoc,
        isInPerson,
      });
    },
    [activeBranchTax, taxConfig]
  );

  const value = useMemo(
    () => ({
      taxConfig,
      isLoading,
      saveConfig,
      activeBranchTax,
      branchConfigs,
      loadBranchConfig,
      saveBranchConfig,
      determineTaxForSale,
    }),
    [taxConfig, isLoading, saveConfig, activeBranchTax, branchConfigs, loadBranchConfig, saveBranchConfig, determineTaxForSale]
  );

  return (
    <TaxConfigContext.Provider value={value}>
      {children}
    </TaxConfigContext.Provider>
  );
}

export function useTaxConfig() {
  const context = useContext(TaxConfigContext);
  if (!context) {
    throw new Error("useTaxConfig debe usarse dentro de TaxConfigProvider");
  }
  return context;
}
