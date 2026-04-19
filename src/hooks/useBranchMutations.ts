import { branchService } from "@/services/branch.service";
import { queryKeys } from "@/lib/query-keys";
import type { Branch } from "@/lib/types";
import type { BranchFormValues } from "@/lib/schemas";
import { useCrudMutations } from "./useCrudMutations";

export function useBranchMutations() {
  const crud = useCrudMutations<Branch, BranchFormValues>({
    service: branchService,
    queryKeysToInvalidate: [
      queryKeys.branches.all,
      queryKeys.branches.allStock,
      queryKeys.products.all,
    ],
    messages: {
      created: "Sede creada exitosamente",
      updated: "Sede actualizada correctamente",
      deleted: "Sede eliminada",
      saveError: "Error al guardar sede: ",
      deleteError: "Error al eliminar sede: ",
    },
  });

  return {
    saveBranch: crud.save,
    saveBranchAsync: crud.saveAsync,
    deleteBranch: crud.remove,
    isSaving: crud.isSaving,
    isDeleting: crud.isDeleting,
  };
}
