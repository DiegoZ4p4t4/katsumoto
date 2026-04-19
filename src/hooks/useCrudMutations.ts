import { useCallback } from "react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { showSuccess, showError } from "@/utils/toast";

export interface CrudService<TCreate, TUpdate = TCreate> {
  create: (data: TCreate) => Promise<unknown>;
  update: (id: string, data: TUpdate) => Promise<unknown>;
  remove: (id: string) => Promise<void>;
}

export interface CrudMutationsConfig<_TEntity extends { id: string }, TForm> {
  service: CrudService<Record<string, unknown>, Record<string, unknown>>;
  queryKeysToInvalidate: QueryKey[];
  mapFormData?: (data: TForm) => unknown;
  messages: {
    created: string;
    updated: string;
    deleted: string;
    saveError: string;
    deleteError: string;
  };
}

export function useCrudMutations<TEntity extends { id: string }, TForm>(
  config: CrudMutationsConfig<TEntity, TForm>
) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    config.queryKeysToInvalidate.forEach((qk) => {
      queryClient.invalidateQueries({ queryKey: qk });
    });
  };

  const saveMutation = useMutation({
    mutationFn: ({
      data,
      editingEntity,
    }: {
      data: TForm;
      editingEntity: TEntity | null;
    }) => {
      const payload = config.mapFormData ? config.mapFormData(data) : data;
      return editingEntity
        ? config.service.update(editingEntity.id, payload)
        : config.service.create(payload);
    },
    onSuccess: (_, { editingEntity }) => {
      invalidate();
      showSuccess(
        editingEntity ? config.messages.updated : config.messages.created
      );
    },
    onError: (err: Error) => {
      showError(config.messages.saveError + err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => config.service.remove(id),
    onSuccess: () => {
      invalidate();
      showSuccess(config.messages.deleted);
    },
    onError: (err: Error) => {
      showError(config.messages.deleteError + err.message);
    },
  });

  const save = useCallback(
    (data: TForm, editingEntity: TEntity | null) =>
      saveMutation.mutate({ data, editingEntity }),
    [saveMutation]
  );

  const saveAsync = useCallback(
    (data: TForm, editingEntity: TEntity | null) =>
      saveMutation.mutateAsync({ data, editingEntity }),
    [saveMutation]
  );

  const remove = useCallback(
    (id: string) => deleteMutation.mutate(id),
    [deleteMutation]
  );

  return {
    save,
    saveAsync,
    remove,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
