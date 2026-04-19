import { useState } from "react";
import { useCategoryImages } from "@/lib/category-images-context";
import { CATEGORY_TREE } from "@/lib/constants";
import { ImageUpload } from "@/components/ImageUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Package, Briefcase, Image as ImageIcon, type LucideIcon } from "lucide-react";

interface CategoryImageManagerProps {
  open: boolean;
  onClose: () => void;
}

const familyIcons: Record<string, LucideIcon> = { productos: Package, servicios: Briefcase };

export function CategoryImageManager({ open, onClose }: CategoryImageManagerProps) {
  const { categoryImages, setCategoryImage } = useCategoryImages();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleImageChange = (category: string, imageUrl: string | null) => {
    setCategoryImage(category, imageUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            Imágenes de Categorías
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Sube una imagen representativa para cada categoría. {Object.keys(categoryImages).length} configuradas.
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-4">
            {Object.entries(CATEGORY_TREE).map(([familyKey, family]) => {
              const FamilyIcon = familyIcons[familyKey] || Package;
              return (
                <div key={familyKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <FamilyIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <h3 className="font-bold text-sm text-foreground">{family.label}</h3>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(family.groups).map(([groupKey, group]) => {
                      const isExpanded = expandedGroups.has(groupKey);
                      const categoriesWithImages = group.categories.filter(
                        c => categoryImages[c]
                      ).length;

                      return (
                        <div key={groupKey} className="border rounded-xl overflow-hidden">
                          <button
                            onClick={() => toggleGroup(groupKey)}
                            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className={`text-[10px] rounded-lg border ${group.color}`}>
                                {group.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {group.categories.length} categorías
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {categoriesWithImages > 0 && (
                                <Badge variant="secondary" className="text-[9px] rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                                  {categoriesWithImages} con imagen
                                </Badge>
                              )}
                              <svg
                                className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="border-t p-3 space-y-3 bg-muted/20">
                              {group.categories.map(category => (
                                <div key={category} className="flex items-center gap-4">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{category}</p>
                                  </div>
                                  <ImageUpload
                                    value={categoryImages[category] || null}
                                    onChange={(url) => handleImageChange(category, url)}
                                    compact
                                    previewClassName="w-10 h-10"
                                    className="flex-shrink-0"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}