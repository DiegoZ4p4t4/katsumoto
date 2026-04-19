import { useState, useRef, useCallback } from "react";
import { useBranches } from "@/hooks/useBranches";
import { useRegisters } from "@/hooks/useRegisters";
import { useRegisterMutations } from "@/hooks/useRegisterMutations";
import { useClients } from "@/hooks/useClients";
import { useClientMutations } from "@/hooks/useClientMutations";
import { useTaxConfig } from "@/lib/tax-config-context";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { invoiceService } from "@/services/invoice.service";
import { registerService } from "@/services/register.service";
import { formatInvoiceNumber } from "@/lib/format";
import { getBranchStock } from "@/lib/utils/stock";
import { DEFAULT_SERIES, INVOICE_TYPES } from "@/lib/constants";
import { queryKeys } from "@/lib/query-keys";
import type {
  Invoice,
  InvoiceType,
  InvoiceItemFormData,
  PaymentMethod,
} from "@/lib/types";
import type { InvoiceCalculation } from "@/lib/calculations";
import type { CartItem } from "@/components/pos/PosCart";
import type { LookupResult } from "@/components/CustomerLookup";
import { generateInvoicePDF } from "@/lib/pdf";
import { getSellerInfo } from "@/lib/printing/seller-info";
import { showSuccess, showError } from "@/utils/toast";

export function usePosInvoice(cart: CartItem[], calc: InvoiceCalculation | null) {
  const queryClient = useQueryClient();
  const { branches: _branches, branchStocks, selectedBranchId, findBranch } = useBranches();
  const { registers, activeRegister } = useRegisters();
  const { openRegister: openRegisterMutation } = useRegisterMutations();
  const { clients } = useClients();
  const { saveClientAsync } = useClientMutations();
  const { taxConfig } = useTaxConfig();

  const [invoiceType, setInvoiceType] = useState<InvoiceType>("boleta");
  const [clientId, setClientId] = useState<string>("none");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [lastInvoiceId, setLastInvoiceId] = useState<string | null>(null);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState<string | undefined>();
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);
  const [openRegisterAmount, setOpenRegisterAmount] = useState("");
  const [showOpenRegister, setShowOpenRegister] = useState(false);

  const invoiceTypeRef = useRef(invoiceType);
  invoiceTypeRef.current = invoiceType;

  const branchId = selectedBranchId;
  const activeBranch = branchId !== "all" ? findBranch(branchId) : null;
  const isWarehouse = activeBranch?.type === "warehouse";
  const openRegister = activeRegister;

  const canSell = !!(activeBranch && !isWarehouse && openRegister);
  const registerNeedsOpen = !!(activeBranch && !isWarehouse && !openRegister);

  const handleOpenRegister = useCallback(() => {
    if (!activeBranch) return;
    const existingOpen = registers.find(
      (r) => r.branch_id === activeBranch.id && r.status === "open"
    );
    if (existingOpen) {
      showError(`Ya existe una caja abierta para ${activeBranch.name} (Caja #${existingOpen.number})`);
      setShowOpenRegister(false);
      return;
    }
    const amount = Math.round(Number(openRegisterAmount) * 100);
    if (amount < 0) return;
    openRegisterMutation(activeBranch.id, amount);
    setShowOpenRegister(false);
    setOpenRegisterAmount("");
  }, [activeBranch, registers, openRegisterAmount, openRegisterMutation]);

  const handleLookupClient = useCallback(async (data: LookupResult) => {
    const currentType = invoiceTypeRef.current;
    if (currentType === "factura" && data.documentType !== "RUC") return;
    if (currentType === "boleta" && data.documentType !== "DNI") return;
    const existing = clients.find((c) => c.document_number === data.documentNumber);
    if (existing) {
      setClientId(existing.id);
      return;
    }
    try {
      const created = await saveClientAsync({
        name: data.name,
        document_type: data.documentType,
        document_number: data.documentNumber,
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        city: data.city || "",
        department_code: data.department_code || "",
        province_code: data.province_code || "",
        district_code: data.district_code || "",
      }, null);
      if (created && (created as { id: string }).id) {
        setClientId((created as { id: string }).id);
      }
    } catch {
      showError("Error al registrar cliente");
    }
  }, [clients, saveClientAsync]);

  const handleInvoiceTypeChange = useCallback((type: InvoiceType) => {
    setInvoiceType(type);
    setClientId("none");
  }, []);

  const handleCobrar = useCallback(() => {
    if (!calc || cart.length === 0) return;
    if (!canSell) {
      if (isWarehouse) showError("Los almacenes no realizan ventas.");
      else if (!openRegister) showError("Necesitas abrir una caja para vender.");
      else showError("Selecciona una sede para operar el POS");
      return;
    }
    if (invoiceType === "factura" && (!clientId || clientId === "none")) return;
    for (const item of cart) {
      const currentStock = branchId === "all"
        ? item.product.stock
        : getBranchStock(branchStocks, branchId, item.product.id);
      if (item.quantity > currentStock) {
        showError(`Stock insuficiente para ${item.product.name}. Disponible: ${currentStock}, en carrito: ${item.quantity}`);
        return;
      }
    }
    setPaymentOpen(true);
  }, [calc, cart, canSell, isWarehouse, openRegister, invoiceType, clientId, branchStocks, branchId]);

  const createInvoiceMutation = useMutation({
    mutationFn: async ({
      method,
    }: {
      method: PaymentMethod;
    }) => {
      if (!calc || !openRegister || !activeBranch) return null;
      const defaultSerie = DEFAULT_SERIES[invoiceType];
      const _serie = activeBranch.invoice_serie_prefix || defaultSerie;
      const client = clientId !== "none" ? clients.find((c) => c.id === clientId) : null;
      const customer = client
        ? { id: client.id, name: client.name, document_number: client.document_number, document_type: client.document_type }
        : { id: "c-default", name: "Consumidor Final", document_number: "00000000", document_type: "DNI" as const };

      const rpcItems: InvoiceItemFormData[] = calc.items.map((item) => ({
        product_id: item.product_id || undefined,
        product_name: item.product_name,
        product_sku: cart.find((c) => c.product.id === item.product_id)?.product.sku || undefined,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents,
        discount_percent: item.discount_percent,
        tax_affectation: item.tax_affectation,
      }));

      const result = await invoiceService.createWithItems(
        {
          customer_id: customer.id,
          invoice_type: invoiceType,
          issue_date: new Date().toISOString().split("T")[0],
          items: rpcItems,
        },
        activeBranch.id,
        method,
        openRegister.id,
      );

      const invoiceNumber = formatInvoiceNumber(result.serie, result.correlativo);

      if (method !== "credit") {
        await registerService.addTransaction(
          openRegister.id,
          method,
          calc.total_cents,
          `[POS] ${invoiceNumber}`
        );
      }

      return { invoiceId: result.id, invoiceNumber };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.registers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.movements.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.allStock });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      if (result?.invoiceId) {
        setLastInvoiceId(result.invoiceId);
      }
    },
  });

  const { data: fetchedInvoice } = useQuery({
    queryKey: lastInvoiceId ? queryKeys.invoices.detail(lastInvoiceId) : ["invoices", "null"],
    queryFn: () => invoiceService.getById(lastInvoiceId!),
    enabled: !!lastInvoiceId,
    staleTime: 0,
  });

  const lastInvoiceData = lastInvoiceId ? (fetchedInvoice ?? lastInvoice) : null;

  const handleConfirmPayment = useCallback((method: PaymentMethod) => {
    if (!calc || !canSell || !openRegister || !activeBranch) return;

    createInvoiceMutation.mutate({ method }, {
      onSuccess: (result) => {
        if (result?.invoiceNumber) {
          setLastInvoiceNumber(result.invoiceNumber);
          showSuccess(`${INVOICE_TYPES[invoiceType].label} ${result.invoiceNumber} emitida`);
        }
      },
      onError: (err: Error) => {
        const isStockError = err.message?.includes("Stock insuficiente");
        if (isStockError) {
          queryClient.invalidateQueries({ queryKey: queryKeys.branches.allStock });
          queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
          showError(`No se pudo emitir: ${err.message}. El stock se ha actualizado, intenta nuevamente.`);
        } else {
          showError(`Error al emitir: ${err.message}`);
        }
      },
    });
  }, [calc, canSell, openRegister, invoiceType, clientId, clients, cart, activeBranch, createInvoiceMutation, queryClient]);

  const handleDownloadPDF = useCallback(async () => {
    if (!lastInvoiceData) return;
    const pdfTaxConfig = taxConfig.sellerProvinceCode
      ? {
          sellerProvinceCode: taxConfig.sellerProvinceCode,
          sellerDistrictCode: taxConfig.sellerDistrictCode || undefined,
          selvaLawEnabled: taxConfig.selvaLawEnabled,
        }
      : undefined;
    const sellerInfo = await getSellerInfo();
    await generateInvoicePDF(lastInvoiceData, sellerInfo, { branchName: activeBranch?.name, taxConfig: pdfTaxConfig });
  }, [lastInvoiceData, activeBranch, taxConfig]);

  const handlePrintTicket = useCallback(async () => {
    if (!lastInvoiceData) return;
    const pdfTaxConfig = taxConfig.sellerProvinceCode
      ? {
          sellerProvinceCode: taxConfig.sellerProvinceCode,
          sellerDistrictCode: taxConfig.sellerDistrictCode || undefined,
          selvaLawEnabled: taxConfig.selvaLawEnabled,
        }
      : undefined;
    const sellerInfo = await getSellerInfo();
    await generateInvoicePDF(lastInvoiceData, sellerInfo, {
      format: "thermal-80mm",
      branchName: activeBranch?.name,
      taxConfig: pdfTaxConfig,
      action: "print",
    });
  }, [lastInvoiceData, activeBranch, taxConfig]);

  const handleClosePayment = useCallback(() => {
    setPaymentOpen(false);
    if (lastInvoiceNumber) {
      setLastInvoiceNumber(undefined);
      setLastInvoiceId(null);
      setLastInvoice(null);
    }
  }, [lastInvoiceNumber]);

  return {
    invoiceType,
    clientId,
    setClientId,
    paymentOpen,
    lastInvoiceNumber,
    openRegisterAmount,
    setOpenRegisterAmount,
    showOpenRegister,
    setShowOpenRegister,
    activeBranch,
    isWarehouse,
    openRegister,
    canSell,
    registerNeedsOpen,
    clients,
    handleOpenRegister,
    handleLookupClient,
    handleInvoiceTypeChange,
    handleCobrar,
    handleConfirmPayment,
    handleDownloadPDF,
    handlePrintTicket,
    handleClosePayment,
  };
}
