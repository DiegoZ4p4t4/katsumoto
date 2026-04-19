import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { categoryService } from "@/services/category.service";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  Package,
  Briefcase,
  FolderTree,
  FolderOpen,
  Folder,
  Tag,
  Image as ImageIcon,
  Layers,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { showSuccess } from "@/utils/toast";
import type {
  ManagedCategoryFamily,
  ManagedCategoryGroup,
  ManagedCategory,
} from "@/lib/types";

type NodeType = "family" | "group" | "category";

export function CategoryManager() {
  const queryClient = useQueryClient();

  const { data: categoryData } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => categoryService.getAllGrouped(),
  });

  const managedFamilies = useMemo(() => categoryData?.families ?? [], [categoryData]);
  const managedGroups = useMemo(() => categoryData?.groups ?? [], [categoryData]);
  const managedCategories = useMemo(() => categoryData?.categories ?? [], [categoryData]);
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(
    new Set()
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set()
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [dialogNodeType, setDialogNodeType] = useState<NodeType>("family");
  const [dialogParentId, setDialogParentId] = useState("");
  const [editingId, setEditingId] = useState("");

  const [formLabel, setFormLabel] = useState("");
  const [formIcon, setFormIcon] = useState("Package");
  const [formColor, setFormColor] = useState(
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
  );
  const [formActiveColor, setFormActiveColor] = useState(
    "bg-emerald-600 text-white"
  );
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    type: NodeType;
    name: string;
  } | null>(null);

  const toggleFamily = (id: string) => {
    setExpandedFamilies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stats = useMemo(() => {
    const families = managedFamilies.length;
    const groups = managedGroups.length;
    const categories = managedCategories.length;
    const withImages = managedCategories.filter((c) => c.imageUrl).length;
    return { families, groups, categories, withImages };
  }, [
    managedFamilies,
    managedGroups,
    managedCategories,
  ]);

  const openAddDialog = (type: NodeType, parentId: string) => {
    setDialogMode("add");
    setDialogNodeType(type);
    setDialogParentId(parentId);
    setEditingId("");
    setFormLabel("");
    setFormIcon(
      type === "family" ? "Package" : type === "group" ? "Folder" : "Tag"
    );
    setFormColor(
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    );
    setFormActiveColor("bg-emerald-600 text-white");
    setFormImageUrl(null);
    setDialogOpen(true);
  };

  const openEditDialog = (
    type: NodeType,
    item: ManagedCategoryFamily | ManagedCategoryGroup | ManagedCategory
  ) => {
    setDialogMode("edit");
    setDialogNodeType(type);
    setEditingId(item.id);
    if (type === "family") {
      const f = item as ManagedCategoryFamily;
      setFormLabel(f.label);
      setFormIcon(f.icon);
      setFormColor(f.color);
      setFormActiveColor(f.activeColor);
    } else if (type === "group") {
      const g = item as ManagedCategoryGroup;
      setFormLabel(g.label);
      setFormIcon(g.icon);
      setFormColor(g.color);
      setDialogParentId(g.familyId);
    } else {
      const c = item as ManagedCategory;
      setFormLabel(c.name);
      setFormImageUrl(c.imageUrl);
      setDialogParentId(c.groupId);
    }
    setDialogOpen(true);
  };

  const invalidateCategories = () => {
    queryClient.invalidateQueries({ queryKey: ["categories", "all"] });
  };

  const handleSave = async () => {
    if (!formLabel.trim()) return;

    if (dialogMode === "add") {
      if (dialogNodeType === "family") {
        const maxOrder = managedFamilies.reduce(
          (max, f) => Math.max(max, f.order),
          -1
        );
        const key = formLabel
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z_]/g, "");
        await categoryService.createFamily({
          key,
          label: formLabel.trim(),
          icon: formIcon,
          color: formColor,
          activeColor: formActiveColor,
          sortOrder: maxOrder + 1,
        });
      } else if (dialogNodeType === "group") {
        const maxOrder = managedGroups
          .filter((g) => g.familyId === dialogParentId)
          .reduce((max, g) => Math.max(max, g.order), -1);
        const key = formLabel
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z_]/g, "");
        await categoryService.createGroup({
          familyId: dialogParentId,
          key,
          label: formLabel.trim(),
          icon: formIcon,
          color: formColor,
          sortOrder: maxOrder + 1,
        });
      } else {
        const maxOrder = managedCategories
          .filter((c) => c.groupId === dialogParentId)
          .reduce((max, c) => Math.max(max, c.order), -1);
        await categoryService.createCategory({
          groupId: dialogParentId,
          name: formLabel.trim(),
          imageUrl: formImageUrl || undefined,
          sortOrder: maxOrder + 1,
        });
      }
      showSuccess(
        (dialogNodeType === "family"
          ? "Familia"
          : dialogNodeType === "group"
          ? "Grupo"
          : "Categor\u00eda") + " creada"
      );
    } else {
      if (dialogNodeType === "family") {
        await categoryService.updateFamily(editingId, {
          label: formLabel.trim(),
          icon: formIcon,
          color: formColor,
          activeColor: formActiveColor,
        });
      } else if (dialogNodeType === "group") {
        await categoryService.updateGroup(editingId, {
          label: formLabel.trim(),
          icon: formIcon,
          color: formColor,
        });
      } else {
        await categoryService.updateCategory(editingId, {
          name: formLabel.trim(),
          imageUrl: formImageUrl,
        });
      }
      showSuccess("Cambios guardados");
    }
    invalidateCategories();
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "family") {
      await categoryService.deleteFamily(deleteTarget.id);
    } else if (deleteTarget.type === "group") {
      await categoryService.deleteGroup(deleteTarget.id);
    } else {
      await categoryService.deleteCategory(deleteTarget.id);
    }
    invalidateCategories();
    showSuccess("Eliminado correctamente");
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const getGroupsForFamily = (familyId: string) =>
    managedGroups
      .filter((g) => g.familyId === familyId)
      .sort((a, b) => a.order - b.order);

  const getCategoriesForGroup = (groupId: string) =>
    managedCategories
      .filter((c) => c.groupId === groupId)
      .sort((a, b) => a.order - b.order);

  const familyIcons: Record<string, LucideIcon> = {
    Package,
    Briefcase,
    Settings2,
    Layers,
  };
  const groupIcons: Record<string, LucideIcon> = {
    Folder,
    FolderOpen,
    Tag,
    Package,
    Briefcase,
    Settings2,
  };

  const colorPresets = [
    {
      label: "Verde",
      color:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      active: "bg-emerald-600 text-white",
    },
    {
      label: "Azul",
      color:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      active: "bg-blue-600 text-white",
    },
    {
      label: "Naranja",
      color:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      active: "bg-orange-600 text-white",
    },
    {
      label: "Morado",
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      active: "bg-purple-600 text-white",
    },
    {
      label: "Rojo",
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      active: "bg-red-600 text-white",
    },
    {
      label: "Cian",
      color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
      active: "bg-cyan-600 text-white",
    },
    {
      label: "Rosa",
      color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
      active: "bg-pink-600 text-white",
    },
    {
      label: "\u00c1mbar",
      color:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      active: "bg-amber-600 text-white",
    },
  ];

  const dialogTitle =
    dialogMode === "add"
      ? "Nueva " +
        (dialogNodeType === "family"
          ? "Familia"
          : dialogNodeType === "group"
          ? "Grupo"
          : "Categor\u00eda")
      : "Editar " +
        (dialogNodeType === "family"
          ? "Familia"
          : dialogNodeType === "group"
          ? "Grupo"
          : "Categor\u00eda");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            Gesti\u00f3n de Categor\u00edas
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Administra la jerarqu\u00eda de familias, grupos y categor\u00edas
            para organizar tus productos
          </p>
        </div>
        <Button
          onClick={() => openAddDialog("family", "")}
          className="rounded-xl bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Familia
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-2xl shadow-sm border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Familias
              </p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {stats.families}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Grupos
              </p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {stats.groups}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                Categor\u00edas
              </p>
              <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                {stats.categories}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm border-orange-200 dark:border-orange-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                Con Imagen
              </p>
              <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
                {stats.withImages}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-0">
          {managedFamilies.length === 0 ? (
            <div className="text-center py-16">
              <FolderTree className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">
                No hay categor\u00edas configuradas
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Crea tu primera familia para comenzar
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {managedFamilies
                .sort((a, b) => a.order - b.order)
                .map((family) => {
                  const isExpanded = expandedFamilies.has(family.id);
                  const groups = getGroupsForFamily(family.id);
                  const FamilyIcon = familyIcons[family.icon] || Package;
                  const totalCategories = groups.reduce(
                    (sum, g) =>
                      sum + getCategoriesForGroup(g.id).length,
                    0
                  );

                  return (
                    <div key={family.id} className="group/fam">
                      <div className="flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors">
                        <button
                          onClick={() => toggleFamily(family.id)}
                          className="p-1 hover:bg-muted rounded-lg transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>

                        <div
                          className={
                            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 " +
                            family.color
                          }
                        >
                          <FamilyIcon className="w-4.5 h-4.5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{family.label}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {groups.length} grupo
                            {groups.length !== 1 ? "s" : ""} &middot;{" "}
                            {totalCategories} categor
                            {totalCategories !== 1 ? "\u00edas" : "\u00eda"}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover/fam:opacity-100 transition-opacity">
                          <button
                            onClick={() => openAddDialog("group", family.id)}
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Agregar grupo"
                          >
                            <Plus className="w-3.5 h-3.5 text-blue-500" />
                          </button>
                          <button
                            onClick={() => openEditDialog("family", family)}
                            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                            title="Editar familia"
                          >
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget({
                                id: family.id,
                                type: "family",
                                name: family.label,
                              });
                              setDeleteOpen(true);
                            }}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Eliminar familia"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && groups.length > 0 && (
                        <div className="bg-muted/10">
                          {groups.map((group) => {
                            const isGroupExpanded = expandedGroups.has(
                              group.id
                            );
                            const categories = getCategoriesForGroup(
                              group.id
                            );
                            const GroupIcon =
                              groupIcons[group.icon] || Folder;

                            return (
                              <div
                                key={group.id}
                                className="group/grp border-l-4 border-muted ml-8"
                              >
                                <div className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                                  <button
                                    onClick={() => toggleGroup(group.id)}
                                    className="p-0.5 hover:bg-muted rounded transition-colors"
                                  >
                                    {isGroupExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                    )}
                                  </button>

                                  <div
                                    className={
                                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 " +
                                      group.color
                                    }
                                  >
                                    <GroupIcon className="w-4 h-4" />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">
                                      {group.label}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {categories.length} categor
                                      {categories.length !== 1
                                        ? "\u00edas"
                                        : "\u00eda"}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1 opacity-0 group-hover/grp:opacity-100 transition-opacity">
                                    <button
                                      onClick={() =>
                                        openAddDialog("category", group.id)
                                      }
                                      className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                      title="Agregar categor\u00eda"
                                    >
                                      <Plus className="w-3.5 h-3.5 text-green-500" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        openEditDialog("group", group)
                                      }
                                      className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                                      title="Editar grupo"
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDeleteTarget({
                                          id: group.id,
                                          type: "group",
                                          name: group.label,
                                        });
                                        setDeleteOpen(true);
                                      }}
                                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                      title="Eliminar grupo"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                    </button>
                                  </div>
                                </div>

                                {isGroupExpanded && categories.length > 0 && (
                                  <div className="pb-2">
                                    {categories.map((cat) => (
                                      <div
                                        key={cat.id}
                                        className="group/cat flex items-center gap-3 px-5 py-2 ml-8 hover:bg-muted/30 transition-colors"
                                      >
                                        <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                          {cat.imageUrl ? (
                                            <img
                                              src={cat.imageUrl}
                                              alt={cat.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <Tag className="w-3.5 h-3.5 text-muted-foreground/40" />
                                          )}
                                        </div>
                                        <p className="text-sm flex-1 min-w-0 truncate">
                                          {cat.name}
                                        </p>
                                        <div className="flex items-center gap-1 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                                          <button
                                            onClick={() =>
                                              openEditDialog("category", cat)
                                            }
                                            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                                            title="Editar categor\u00eda"
                                          >
                                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              setDeleteTarget({
                                                id: cat.id,
                                                type: "category",
                                                name: cat.name,
                                              });
                                              setDeleteOpen(true);
                                            }}
                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Eliminar categor\u00eda"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {isGroupExpanded && categories.length === 0 && (
                                  <div className="ml-16 py-3 text-xs text-muted-foreground/50">
                                    Sin categor\u00edas &mdash;{" "}
                                    <button
                                      onClick={() =>
                                        openAddDialog("category", group.id)
                                      }
                                      className="text-orange-600 dark:text-orange-400 hover:underline"
                                    >
                                      agregar una
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {isExpanded && groups.length === 0 && (
                        <div className="ml-16 py-3 text-xs text-muted-foreground/50 bg-muted/10">
                          Sin grupos &mdash;{" "}
                          <button
                            onClick={() => openAddDialog("group", family.id)}
                            className="text-orange-600 dark:text-orange-400 hover:underline"
                          >
                            agregar uno
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                {dialogNodeType === "category"
                  ? "Nombre de la Categor\u00eda *"
                  : "Nombre *"}
              </Label>
              <Input
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                className="rounded-xl"
                placeholder={
                  dialogNodeType === "family"
                    ? "Ej: Productos"
                    : dialogNodeType === "group"
                    ? "Ej: Repuestos"
                    : "Ej: Filtraci\u00f3n"
                }
                autoFocus
              />
            </div>

            {dialogNodeType !== "category" && (
              <div className="space-y-2">
                <Label>Icono</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(familyIcons).map(([name, Icon]) => (
                    <button
                      key={name}
                      onClick={() => setFormIcon(name)}
                      className={
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all " +
                        (formIcon === name
                          ? "bg-orange-100 dark:bg-orange-900/30 ring-2 ring-orange-500"
                          : "bg-muted/50 hover:bg-muted")
                      }
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {dialogNodeType !== "category" && (
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setFormColor(preset.color);
                        setFormActiveColor(preset.active);
                      }}
                      className={
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all " +
                        (formColor === preset.color
                          ? "ring-2 ring-offset-2 ring-orange-500"
                          : "hover:ring-1 hover:ring-muted-foreground/30") +
                        " " +
                        preset.color
                      }
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {dialogNodeType === "category" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Imagen de la Categor\u00eda
                </Label>
                <ImageUpload
                  value={formImageUrl}
                  onChange={(url) => setFormImageUrl(url)}
                  previewClassName="w-24 h-24"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formLabel.trim()}
              className="rounded-xl bg-orange-600 hover:bg-orange-700"
            >
              {dialogMode === "add" ? "Crear" : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {" "}
              {"\u00bf"}Eliminar{" "}
              {deleteTarget?.type === "family"
                ? "familia"
                : deleteTarget?.type === "group"
                ? "grupo"
                : "categor\u00eda"}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "family"
                ? 'Se eliminar\u00e1 "' +
                  deleteTarget.name +
                  '" y todos sus grupos y categor\u00edas asociadas.'
                : deleteTarget?.type === "group"
                ? 'Se eliminar\u00e1 "' +
                  deleteTarget.name +
                  '" y todas sus categor\u00edas asociadas.'
                : 'Se eliminar\u00e1 la categor\u00eda "' +
                  deleteTarget?.name +
                  '". Los productos que la usen no se ver\u00e1n afectados, pero perder\u00e1n esta clasificaci\u00f3n.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}