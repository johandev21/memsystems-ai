import { useCallback, useState } from "react";
import {
  createPrototypeFolder,
  duplicatePrototypeMaterial,
  getPrototypeItemName,
  movePrototypeItem,
  renamePrototypeItem,
  softDeletePrototypeItem,
  type PrototypeTreeState,
} from "./study-material-tree";
import { INITIAL_PROTOTYPE_TREE_STATE } from "./study-material-tree.fixture";
import type {
  CommandResult,
  TreeCommand,
  TreeCommandExecutor,
} from "./study-material-tree.commands";

export type PrototypeTreeAdapter = {
  readonly folders: PrototypeTreeState["folders"];
  readonly materials: PrototypeTreeState["materials"];
  readonly lastAction: string;
  readonly execute: TreeCommandExecutor;
  readonly state: PrototypeTreeState;
  readonly setState: (state: PrototypeTreeState) => void;
};

export function usePrototypeTreeAdapter(
  initialState: PrototypeTreeState = INITIAL_PROTOTYPE_TREE_STATE as unknown as PrototypeTreeState,
): PrototypeTreeAdapter {
  const [state, setState] = useState<PrototypeTreeState>(initialState);
  const [lastAction, setLastAction] = useState("Ready to move study materials in memory.");

  const execute: TreeCommandExecutor = useCallback(
    async (command: TreeCommand): Promise<CommandResult> => {
      const now = new Date().toISOString();

      switch (command.type) {
        case "createFolder": {
          const id = `folder-${crypto.randomUUID()}`;
          const folder = createPrototypeFolder(command.parentId, id, now);
          setState((prev) => ({ ...prev, folders: [...prev.folders, folder] }));
          setLastAction(`Created ${folder.name}.`);
          return { ok: true, newId: id };
        }
        case "renameItem": {
          const previousName = getPrototypeItemName(state, command.id) ?? "Item";
          const nextName = command.name.trim();
          if (!nextName || previousName === nextName) {
            return { ok: true };
          }
          setState((prev) => renamePrototypeItem(prev, command.id, nextName, now));
          setLastAction(`Renamed ${previousName} to ${nextName}.`);
          return { ok: true };
        }
        case "duplicateMaterial": {
          const name = getPrototypeItemName(state, command.id) ?? "Study material";
          const newId = `material-${crypto.randomUUID()}`;
          const nextState = duplicatePrototypeMaterial(state, command.id, newId, now);
          if (nextState === state) {
            return { ok: false, error: "Material not found" };
          }
          setState(nextState);
          setLastAction(`Duplicated ${name}.`);
          return { ok: true, newId };
        }
        case "moveItem": {
          const name = getPrototypeItemName(state, command.id) ?? "Item";
          const targetName =
            command.targetFolderId === null
              ? "Study Materials"
              : (getPrototypeItemName(state, command.targetFolderId) ?? "folder");
          const nextState = movePrototypeItem(state, command.id, command.targetFolderId, now);
          if (nextState === state) {
            return { ok: false, error: "Invalid move" };
          }
          setState(nextState);
          setLastAction(`Moved ${name} to ${targetName}.`);
          return { ok: true };
        }
        case "deleteItem": {
          const name = getPrototypeItemName(state, command.id) ?? "Item";
          const nextState = softDeletePrototypeItem(state, command.id, now);
          // if nothing changed, treat as no-op but still ok
          setState(nextState);
          setLastAction(`Deleted ${name} from the local prototype.`);
          return { ok: true };
        }
        default:
          return { ok: false, error: "Unknown command" };
      }
    },
    [state],
  );

  return {
    folders: state.folders,
    materials: state.materials,
    lastAction,
    execute,
    state,
    setState,
  };
}
