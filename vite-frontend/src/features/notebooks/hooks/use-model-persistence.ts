import { useCallback, useState } from "react";

const STORAGE_KEY = "memsystems-selected-model";

export function useModelPersistence(notebookId: string) {
  const [model, setModel] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return (
      localStorage.getItem(`${STORAGE_KEY}-${notebookId}`) ??
      localStorage.getItem("memsystems:selected-model") ??
      undefined
    );
  });

  const persistModel = useCallback(
    (id: string) => {
      localStorage.setItem(`${STORAGE_KEY}-${notebookId}`, id);
      localStorage.setItem("memsystems:selected-model", id);
      setModel(id);
    },
    [notebookId],
  );

  return { model, setModel: persistModel };
}
