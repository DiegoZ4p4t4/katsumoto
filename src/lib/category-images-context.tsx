import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

interface CategoryImagesContextType {
  categoryImages: Record<string, string>;
  setCategoryImage: (category: string, imageUrl: string | null) => void;
}

const CategoryImagesContext = createContext<CategoryImagesContextType | null>(null);

export function CategoryImagesProvider({ children }: { children: ReactNode }) {
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});

  const setCategoryImage = useCallback((category: string, imageUrl: string | null) => {
    setCategoryImages((prev) => ({
      ...prev,
      [category]: imageUrl ?? "",
    }));
  }, []);

  const value = useMemo(() => ({ categoryImages, setCategoryImage }), [categoryImages, setCategoryImage]);

  return (
    <CategoryImagesContext.Provider value={value}>
      {children}
    </CategoryImagesContext.Provider>
  );
}

export function useCategoryImages() {
  const context = useContext(CategoryImagesContext);
  if (!context) {
    throw new Error("useCategoryImages debe usarse dentro de CategoryImagesProvider");
  }
  return context;
}
