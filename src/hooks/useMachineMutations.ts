import { machineService } from "@/services/machine.service";
import { queryKeys } from "@/lib/query-keys";
import type { MachineModel } from "@/lib/types";
import type { MachineFormValues } from "@/lib/schemas";
import { useCrudMutations } from "./useCrudMutations";

export function useMachineMutations() {
  const crud = useCrudMutations<MachineModel, MachineFormValues>({
    service: machineService,
    queryKeysToInvalidate: [
      queryKeys.machines.all,
      queryKeys.machines.productMachines,
      queryKeys.products.all,
    ],
    mapFormData: (data) => ({
      name: data.name,
      brand: data.brand,
      model: data.model,
      category: data.category,
      year: data.year ? parseInt(data.year) : undefined,
      description: data.description || undefined,
    }),
    messages: {
      created: "Modelo de máquina registrado",
      updated: "Modelo de máquina actualizado",
      deleted: "Modelo de máquina eliminado",
      saveError: "Error al guardar modelo: ",
      deleteError: "Error al eliminar modelo: ",
    },
  });

  return {
    saveMachine: crud.save,
    saveMachineAsync: crud.saveAsync,
    deleteMachine: crud.remove,
    isSaving: crud.isSaving,
    isDeleting: crud.isDeleting,
  };
}
