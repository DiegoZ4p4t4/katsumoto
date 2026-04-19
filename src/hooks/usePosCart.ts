import { useState, useMemo, useCallback } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useBranches } from "@/hooks/useBranches";
import { useTaxConfig } from "@/lib/tax-config-context";
import { calculateInvoice } from "@/lib/calculations";
import { getEffectivePriceInfo } from "@/lib/pricing";
import { determineTaxForTransaction, determineProductTax } from "@/lib/tax-engine";
import type { Product, TaxAffectation, Customer } from "@/lib/types";
import type { CartItem } from "@/components/pos/PosCart";
import type { BranchLocation, CustomerLocation } from "@/lib/tax-engine";
import { showError } from "@/utils/toast";

export function usePosCart(selectedCustomer?: Customer | null) {
  const { activeBranchProducts: branchProducts, priceTiers } = useProducts();
  const { branches, selectedBranchId } = useBranches();
  const { taxConfig, branchConfigs, loadBranchConfig: _loadBranchConfig } = useTaxConfig();
  const [cart, setCart] = useState<CartItem[]>([]);

  const activeBranch = useMemo(
    () => branches.find((b) => b.id === selectedBranchId) ?? null,
    [branches, selectedBranchId],
  );

  const computeCartFields = useCallback(
    (product: Product, quantity: number) => {
      const info = getEffectivePriceInfo(product, priceTiers, quantity);
      return {
        effectivePriceCents: info.priceCents,
        appliedTierLabel: info.tierLabel,
        isTierPrice: !info.isRetail,
        savingsCents: info.savingsCents,
      };
    },
    [priceTiers]
  );

  const addToCart = useCallback(
    (product: Product) => {
      if (product.stock === 0) {
        showError(`${product.name} esta agotado`);
        return;
      }
      let stockExceeded = false;
      setCart((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          const newQty = existing.quantity + 1;
          if (newQty > product.stock) {
            stockExceeded = true;
            return prev;
          }
          const fields = computeCartFields(product, newQty);
          return prev.map((i) =>
            i.product.id === product.id ? { ...i, quantity: newQty, ...fields } : i
          );
        }
        const fields = computeCartFields(product, 1);
        return [...prev, { product, quantity: 1, ...fields }];
      });
      if (stockExceeded) {
        showError(`Stock insuficiente. Solo hay ${product.stock} unidades disponibles`);
      }
    },
    [computeCartFields]
  );

  const updateQty = useCallback(
    (productId: string, delta: number) => {
      let stockExceeded = false;
      let exceededStock = 0;
      setCart((prev) =>
        prev.map((item) => {
          if (item.product.id !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0 || newQty > item.product.stock) {
            if (newQty > item.product.stock) {
              stockExceeded = true;
              exceededStock = item.product.stock;
            }
            return item;
          }
          const fields = computeCartFields(item.product, newQty);
          return { ...item, quantity: newQty, ...fields };
        })
      );
      if (stockExceeded) {
        showError(`Stock insuficiente. Solo hay ${exceededStock} unidades disponibles`);
      }
    },
    [computeCartFields]
  );

  const removeFromCart = useCallback(
    (productId: string) => setCart((prev) => prev.filter((i) => i.product.id !== productId)),
    []
  );

  const clearCart = useCallback(() => setCart([]), []);

  const effectiveTaxConfig = useMemo(() => {
    if (selectedBranchId && selectedBranchId !== "all") {
      const branchConfig = branchConfigs.get(selectedBranchId);
      if (branchConfig && branchConfig.sellerProvinceCode) return branchConfig;
    }
    if (activeBranch?.province_code) {
      return {
        ...taxConfig,
        sellerDepartmentCode: activeBranch.department_code,
        sellerProvinceCode: activeBranch.province_code,
        sellerDistrictCode: activeBranch.district_code,
        sellerIsSelva: activeBranch.is_selva_zone,
      };
    }
    return taxConfig;
  }, [taxConfig, branchConfigs, selectedBranchId, activeBranch]);

  const overallTaxDetermination = useMemo(() => {
    if (!effectiveTaxConfig.sellerProvinceCode) return null;

    const branch: BranchLocation = {
      department_code: effectiveTaxConfig.sellerDepartmentCode,
      province_code: effectiveTaxConfig.sellerProvinceCode,
      district_code: effectiveTaxConfig.sellerDistrictCode,
      is_selva_zone: effectiveTaxConfig.sellerIsSelva,
    };

    let customer: CustomerLocation | undefined;
    if (selectedCustomer) {
      customer = {
        department_code: selectedCustomer.department_code || "",
        province_code: selectedCustomer.province_code || "",
        district_code: selectedCustomer.district_code || "",
        is_selva_zone: selectedCustomer.is_selva_zone,
      };
    }

    return determineTaxForTransaction({
      branch,
      selvaLawEnabled: effectiveTaxConfig.selvaLawEnabled,
      customer,
      isInPerson: true,
    });
  }, [effectiveTaxConfig, selectedCustomer]);

  const formItems = useMemo(
    () =>
      cart.map((item) => {
        let taxAffectation: TaxAffectation = item.product.tax_affectation || "gravado";
        if (overallTaxDetermination) {
          const result = determineProductTax(
            overallTaxDetermination,
            item.product.tax_affectation
          );
          taxAffectation = result.affectation;
        }
        return {
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price_cents: item.effectivePriceCents,
          discount_percent: 0,
          tax_affectation: taxAffectation,
        };
      }),
    [cart, overallTaxDetermination]
  );

  const calc = useMemo(() => formItems.length > 0 ? calculateInvoice(formItems) : null, [formItems]);

  return {
    cart,
    setCart,
    branchProducts,
    priceTiers,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    calc,
    overallTaxDetermination,
  };
}
