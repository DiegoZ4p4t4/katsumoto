import { customerService } from "@/services/customer.service";
import { queryKeys } from "@/lib/query-keys";
import type { Customer } from "@/lib/types";
import type { ClientFormValues } from "@/lib/schemas";
import { useCrudMutations } from "./useCrudMutations";

export function useClientMutations() {
  const crud = useCrudMutations<Customer, ClientFormValues>({
    service: customerService,
    queryKeysToInvalidate: [queryKeys.clients.all],
    messages: {
      created: "Cliente registrado exitosamente",
      updated: "Cliente actualizado correctamente",
      deleted: "Cliente eliminado",
      saveError: "Error al guardar cliente: ",
      deleteError: "Error al eliminar cliente: ",
    },
  });

  return {
    saveClient: crud.save,
    saveClientAsync: crud.saveAsync,
    deleteClient: crud.remove,
    isSaving: crud.isSaving,
    isDeleting: crud.isDeleting,
  };
}
