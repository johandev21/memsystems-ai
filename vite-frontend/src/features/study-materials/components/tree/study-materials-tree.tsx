import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { deleteFolder, foldersQueryOptions } from "@/lib/api-client/folders";
import {
  deleteStudyMaterial,
  studyMaterialsQueryOptions,
} from "@/lib/api-client/study-materials";
import { cn } from "@/lib/utils";
import { StudyMaterialsEmptyState } from "./study-materials-empty-state";
import {
  buildStudyMaterialTree,
  countMaterialsInFolder,
  type TreeNode,
} from "./study-materials-tree-helpers";
import { FileTreeItemNode } from "./tree-node";

export type ResourceType =
  | "quiz"
  | "flashcards"
  | "report"
  | "roadmap"
  | "slidedeck"
  | "mindmap"
  | "folder";

const KIND_TO_RESOURCE_TYPE: Record<string, ResourceType> = {
  quiz: "quiz",
  simple_flashcard: "flashcards",
  report: "report",
  roadmap: "roadmap",
  slide_deck: "slidedeck",
  mind_map: "mindmap",
};

export interface FileTreeItem {
  id: string;
  name: string;
  type: ResourceType;
  items?: FileTreeItem[];
  isOpen?: boolean;
  materialCount?: number;
}

interface RealDataProps {
  notebookId: string;
  onSelectMaterial?: (materialId: string) => void;
  className?: string;
}

export function StudyMaterialsTree(props: RealDataProps) {
  const { notebookId, onSelectMaterial, className } = props;
  const queryClient = useQueryClient();
  const foldersQuery = useQuery(foldersQueryOptions(notebookId));
  const materialsQuery = useQuery(studyMaterialsQueryOptions(notebookId));

  const folders = foldersQuery.data ?? [];
  const materials = materialsQuery.data ?? [];

  const [materialToDelete, setMaterialToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [folderToDelete, setFolderToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (materialId: string) => deleteStudyMaterial(materialId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["study-materials", notebookId],
      });
      toast.success("Material deleted");
      setMaterialToDelete(null);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to delete material");
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: string) => deleteFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["study-material-folders", notebookId],
      });
      queryClient.invalidateQueries({
        queryKey: ["study-materials", notebookId],
      });
      toast.success("Folder deleted");
      setFolderToDelete(null);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to delete folder");
    },
  });

  const handleConfirmDelete = () => {
    if (materialToDelete) {
      deleteMutation.mutate(materialToDelete.id);
    }
  };

  const handleDeleteFolderRequest = (id: string, name: string) => {
    if (hasActiveMaterials(id, folders, materials)) {
      toast.error(`Folder "${name}" is not empty`);
      return;
    }
    setFolderToDelete({ id, name });
  };

  const baseTree = useMemo(
    () =>
      buildStudyMaterialTree({
        folders: foldersQuery.data ?? [],
        materials: materialsQuery.data ?? [],
      }),
    [foldersQuery.data, materialsQuery.data],
  );

  const [openFolderIds, setOpenFolderIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    for (const n of baseTree) {
      if (n.type === "folder") ids.add(n.id);
    }
    return ids;
  });

  const toggleFolder = (id: string) => {
    setOpenFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const items: FileTreeItem[] = baseTree.map((node) => {
    if (node.type === "folder") {
      return {
        id: node.id,
        name: node.name,
        type: "folder",
        isOpen: openFolderIds.has(node.id),
        materialCount: countMaterialsInFolder(node.id, materials),
        items: [],
      };
    }
    return {
      id: node.id,
      name: node.name,
      type: KIND_TO_RESOURCE_TYPE[node.materialKind ?? "report"] ?? "report",
    };
  });

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {items.length === 0 ? (
        <StudyMaterialsEmptyState />
      ) : (
        items.map((item) => (
          <FileTreeItemNode
            key={item.id}
            item={item}
            depth={0}
            onToggleFolder={toggleFolder}
            onSelectMaterial={onSelectMaterial}
            onDeleteMaterial={(id, name) => setMaterialToDelete({ id, name })}
            onDeleteFolder={(id, name) => handleDeleteFolderRequest(id, name)}
            folderChildrenById={folderChildrenIndex(baseTree, openFolderIds)}
          />
        ))
      )}

      <ConfirmDeleteDialog
        open={materialToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setMaterialToDelete(null);
        }}
        title="Delete Material"
        description={`Are you sure you want to delete "${materialToDelete?.name ?? ""}"?`}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />

      <ConfirmDeleteDialog
        open={folderToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setFolderToDelete(null);
        }}
        title="Delete Folder"
        description={`Are you sure you want to delete folder "${folderToDelete?.name ?? ""}"?`}
        onConfirm={() => {
          if (folderToDelete) {
            deleteFolderMutation.mutate(folderToDelete.id);
          }
        }}
        isLoading={deleteFolderMutation.isPending}
      />
    </div>
  );
}

function folderChildrenIndex(
  baseTree: TreeNode[],
  openFolderIds: Set<string>,
): Map<string, FileTreeItem[]> {
  const out = new Map<string, FileTreeItem[]>();
  const visit = (node: TreeNode) => {
    if (node.type === "folder") {
      const items: FileTreeItem[] = node.children.map((child) => {
        if (child.type === "folder") {
          return {
            id: child.id,
            name: child.name,
            type: "folder",
            isOpen: openFolderIds.has(child.id),
            items: [],
          };
        }
        return {
          id: child.id,
          name: child.name,
          type:
            KIND_TO_RESOURCE_TYPE[child.materialKind ?? "report"] ?? "report",
        };
      });
      out.set(node.id, items);
      for (const c of node.children) visit(c);
    }
  };
  for (const n of baseTree) visit(n);
  return out;
}

export type { TreeNode };

function hasActiveMaterials(
  folderId: string,
  folders: { id: string; parentId: string | null; deletedAt: string | null }[],
  materials: { folderId: string | null; deletedAt: string | null }[],
): boolean {
  const directMaterials = materials.some(
    (m) => m.folderId === folderId && !m.deletedAt,
  );
  if (directMaterials) return true;

  const childFolders = folders.filter(
    (f) => f.parentId === folderId && !f.deletedAt,
  );
  for (const child of childFolders) {
    if (hasActiveMaterials(child.id, folders, materials)) return true;
  }
  return false;
}
