"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  HelpCircle,
  type LucideIcon,
  Map as MapIcon,
  MoreVertical,
  Network,
  Presentation,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const RESOURCE_ICONS: Record<
  ResourceType,
  { icon: LucideIcon; className: string }
> = {
  quiz: { icon: HelpCircle, className: "text-muted-foreground" },
  flashcards: { icon: Brain, className: "text-muted-foreground" },
  report: { icon: FileText, className: "text-muted-foreground" },
  roadmap: { icon: MapIcon, className: "text-muted-foreground" },
  slidedeck: {
    icon: Presentation,
    className: "text-muted-foreground",
  },
  mindmap: { icon: Network, className: "text-muted-foreground" },
  folder: { icon: Folder, className: "text-muted-foreground" },
};

function treeNodeToFileTreeItem(
  node: TreeNode,
  materialCount: number,
  isOpen: boolean,
): FileTreeItem {
  if (node.type === "folder") {
    return {
      id: node.id,
      name: node.name,
      type: "folder",
      isOpen,
      materialCount,
      items: node.children.map((child) =>
        treeNodeToFileTreeItem(child, child.type === "folder" ? 0 : 0, false),
      ),
    };
  }
  return {
    id: node.id,
    name: node.name,
    type: KIND_TO_RESOURCE_TYPE[node.materialKind ?? "report"] ?? "report",
  };
}

interface RealDataProps {
  notebookId: string;
  onSelectMaterial?: (materialId: string) => void;
  className?: string;
}

export function StudyMaterialsTree(props: RealDataProps) {
  const { notebookId, onSelectMaterial, className } = props;
  const t = useTranslations("StudyMaterials");
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
      toast.success(t("deleted"));
      setMaterialToDelete(null);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? t("deleteFailed"));
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
      toast.success(t("folderDeleted"));
      setFolderToDelete(null);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? t("folderDeleteFailed"));
    },
  });

  const handleConfirmDelete = () => {
    if (materialToDelete) {
      deleteMutation.mutate(materialToDelete.id);
    }
  };

  const handleDeleteFolderRequest = (id: string, name: string) => {
    if (hasActiveMaterials(id, folders, materials)) {
      toast.error(t("folderNotEmpty", { name }));
      return;
    }
    setFolderToDelete({ id, name });
  };

  const baseTree = useMemo(
    () => buildStudyMaterialTree({ folders, materials }),
    [folders, materials],
  );

  const [openFolderIds, setOpenFolderIds] = useState<Set<string>>(() => {
    // Default-open every root folder for friendliness; the user can collapse.
    return new Set(
      baseTree.filter((n) => n.type === "folder").map((n) => n.id),
    );
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

      <AlertDialog
        open={materialToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setMaterialToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteMaterialTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteMaterialDesc", { name: materialToDelete?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={folderToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setFolderToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteFolderTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteFolderDesc", { name: folderToDelete?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (folderToDelete) {
                  deleteFolderMutation.mutate(folderToDelete.id);
                }
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Indexes folder children by id so a folder node can render its real children
// (which carry the per-row click semantics for materials).
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

function FileTreeItemNode({
  item,
  depth,
  onToggleFolder,
  onSelectMaterial,
  onDeleteMaterial,
  onDeleteFolder,
  folderChildrenById,
}: {
  item: FileTreeItem;
  depth: number;
  onToggleFolder: (id: string) => void;
  onSelectMaterial?: (id: string) => void;
  onDeleteMaterial?: (id: string, name: string) => void;
  onDeleteFolder?: (id: string, name: string) => void;
  folderChildrenById: Map<string, FileTreeItem[]>;
}) {
  const isFolder = item.type === "folder";
  const paddingLeft = 8 + depth * 16;
  const config = RESOURCE_ICONS[item.type];
  const Icon = isFolder ? (item.isOpen ? FolderOpen : Folder) : config.icon;

  const handleClick = () => {
    if (isFolder) {
      onToggleFolder(item.id);
      return;
    }
    onSelectMaterial?.(item.id);
  };

  const nodeContent = (
    // biome-ignore lint/a11y/useSemanticElements: nested buttons are invalid HTML, so div role=button is required here
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      style={{ paddingLeft: `${paddingLeft}px` }}
      className={cn(
        "group relative flex w-full items-center gap-2.5 py-1.5 pr-4 text-left text-[13px] font-mono transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer select-none",
        isFolder
          ? "text-foreground hover:bg-muted/50"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      )}
    >
      {isFolder && (
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-muted-foreground",
            item.isOpen && "rotate-90",
          )}
        />
      )}
      {!isFolder && <span className="w-3.5 shrink-0" />}
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          isFolder ? "text-foreground/70" : config.className,
        )}
        strokeWidth={2}
      />
      <span className="truncate flex-1 pr-1">{item.name}</span>
      {isFolder && (
        <div className="ml-auto flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {typeof item.materialCount === "number" && item.materialCount > 0 && (
            <span className="text-[10px] text-muted-foreground/70 tabular-nums mr-1">
              {item.materialCount}
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Options for ${item.name}`}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFolder?.(item.id, item.name);
                }}
                className="cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {!isFolder && (
        <div className="ml-auto opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Options for ${item.name}`}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteMaterial?.(item.id, item.name);
                }}
                className="cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );

  if (isFolder) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{nodeContent}</ContextMenuTrigger>
        <ContextMenuContent className="w-40">
          <ContextMenuItem
            variant="destructive"
            onClick={() => onDeleteFolder?.(item.id, item.name)}
            className="cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
        {item.isOpen && (
          <div className="flex flex-col gap-0.5 mt-0.5">
            {(folderChildrenById.get(item.id) ?? []).map((child) => (
              <FileTreeItemNode
                key={child.id}
                item={child}
                depth={depth + 1}
                onToggleFolder={onToggleFolder}
                onSelectMaterial={onSelectMaterial}
                onDeleteMaterial={onDeleteMaterial}
                onDeleteFolder={onDeleteFolder}
                folderChildrenById={folderChildrenById}
              />
            ))}
          </div>
        )}
      </ContextMenu>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{nodeContent}</ContextMenuTrigger>
      <ContextMenuContent className="w-40">
        <ContextMenuItem
          variant="destructive"
          onClick={() => onDeleteMaterial?.(item.id, item.name)}
          className="cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// Keep the legacy mock export so existing imports of fileTreeData don't break.
// The mock is no longer used by the desktop components but other tests may
// import it; harmless to keep.
export const fileTreeData: FileTreeItem[] = [];

// Re-export so consumers can import the tree shape directly if needed.
export type { TreeNode };
// treeNodeToFileTreeItem is internal; keep it module-private.
export const __test__ = { treeNodeToFileTreeItem };

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
