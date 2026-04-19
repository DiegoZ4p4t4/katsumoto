import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

const STORAGE_KEY = "katsumoto:selected-branch";

interface BranchSelectionContextType {
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
}

const BranchSelectionContext = createContext<BranchSelectionContextType | null>(null);

export function BranchSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedBranchId, setRawBranchId] = useState(
    () => localStorage.getItem(STORAGE_KEY) || "all"
  );

  const setSelectedBranchId = useCallback((id: string) => {
    setRawBranchId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const value = useMemo(() => ({ selectedBranchId, setSelectedBranchId }), [selectedBranchId, setSelectedBranchId]);

  return (
    <BranchSelectionContext.Provider value={value}>
      {children}
    </BranchSelectionContext.Provider>
  );
}

export function useBranchSelection() {
  const context = useContext(BranchSelectionContext);
  if (!context) {
    throw new Error("useBranchSelection debe usarse dentro de BranchSelectionProvider");
  }
  return context;
}
