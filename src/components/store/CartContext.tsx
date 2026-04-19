import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type { Product, Cents } from "@/lib/types";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, maxStock?: number) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, maxStock?: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalCents: Cents;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product, maxStock?: number): boolean => {
    const effectiveMax = maxStock ?? Infinity;
    if (effectiveMax <= 0) return false;

    const existing = items.find(i => i.product.id === product.id);
    if (existing) {
      if (existing.quantity >= effectiveMax) return false;
      setItems(prev =>
        prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
      return true;
    }

    setItems(prev => [...prev, { product, quantity: 1 }]);
    return true;
  }, [items]);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, maxStock?: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.product.id !== productId));
      return;
    }
    const effectiveMax = maxStock ?? Infinity;
    const clampedQty = Math.min(quantity, effectiveMax);
    setItems(prev =>
      prev.map(i =>
        i.product.id === productId ? { ...i, quantity: clampedQty } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const totalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price_cents * i.quantity, 0 as Cents),
    [items]
  );

  const contextValue = useMemo(() => ({
    items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalCents
  }), [items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalCents]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider");
  return context;
}