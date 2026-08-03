import {
  Background,
  BackgroundVariant,
  BezierEdge,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import { ChevronRight, Crosshair, Minus, Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export interface MindMapNodeData {
  id: string;
  label: string;
  color?: string | null;
  position?: { x: number; y: number };
}

export interface MindMapEdgeData {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  directed?: boolean;
}

export interface MindMapViewProps {
  materialId: string;
  materialTitle?: string;
  content: {
    rootId?: string | null;
    nodes: MindMapNodeData[];
    edges: MindMapEdgeData[];
  };
}

type MapItem = {
  id: string;
  label: string;
  color?: string;
  children: MapItem[];
};

type MindMapNodeDataInternal = {
  item: MapItem;
  depth: number;
  expanded: boolean;
  selected: boolean;
  onToggle: (id: string) => void;
};

type MindMapFlowNode = Node<MindMapNodeDataInternal, "mindMap">;

function MindMapNode({ data }: NodeProps<MindMapFlowNode>) {
  const isRoot = data.depth === 0;
  const hasChildren = data.item.children.length > 0;

  return (
    <div
      className={cn(
        "group relative min-w-[190px] max-w-[230px] rounded-lg border bg-card px-4 py-3 text-left text-card-foreground shadow-sm transition-all duration-200",
        isRoot && "min-w-[210px] rounded-full border-primary bg-primary text-primary-foreground",
        data.selected && !isRoot && "border-primary ring-1 ring-primary",
        !data.selected && !isRoot && "border-border hover:border-foreground/30",
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-1 !w-1 !border-0 !bg-transparent" />
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold leading-tight">{data.item.label}</span>
      </div>

      {hasChildren && (
        <button
          type="button"
          aria-label={data.expanded ? `Collapse ${data.item.label}` : `Expand ${data.item.label}`}
          onClick={(event) => {
            event.stopPropagation();
            data.onToggle(data.item.id);
          }}
          className="absolute -right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className={cn("size-3.5 transition-transform", data.expanded && "rotate-90")} />
        </button>
      )}
      <Handle type="source" position={Position.Right} className="!h-1 !w-1 !border-0 !bg-transparent" />
    </div>
  );
}

function HighlightEdge(props: EdgeProps<Edge>) {
  return <BezierEdge {...props} />;
}

const nodeTypes = { mindMap: MindMapNode };
const edgeTypes = { highlight: HighlightEdge };

function createTree(
  content: MindMapViewProps["content"],
): { root: MapItem | null; depths: Map<string, number> } {
  const nodesById = new Map(content.nodes.map((node) => [node.id, node]));
  const childrenById = new Map<string, string[]>();
  const childIds = new Set<string>();

  for (const edge of content.edges) {
    if (!nodesById.has(edge.sourceId) || !nodesById.has(edge.targetId)) continue;
    const children = childrenById.get(edge.sourceId) ?? [];
    children.push(edge.targetId);
    childrenById.set(edge.sourceId, children);
    childIds.add(edge.targetId);
  }

  const rootId = content.rootId || content.nodes.find((node) => !childIds.has(node.id))?.id;
  if (!rootId || !nodesById.has(rootId)) return { root: null, depths: new Map() };

  const visited = new Set<string>();
  const depths = new Map<string, number>();
  const build = (id: string, depth: number): MapItem | null => {
    if (visited.has(id)) return null;
    const node = nodesById.get(id);
    if (!node) return null;
    visited.add(id);
    depths.set(id, depth);

    return {
      id: node.id,
      label: node.label,
      color: node.color,
      children: (childrenById.get(id) ?? []).flatMap((childId) => {
        const child = build(childId, depth + 1);
        return child ? [child] : [];
      }),
    };
  };

  return { root: build(rootId, 0), depths };
}

function buildGraph(
  root: MapItem,
  expandedIds: Set<string>,
  selectedId: string | null,
  onToggle: (id: string) => void,
): { nodes: MindMapFlowNode[]; edges: Edge[] } {
  const nodes: MindMapFlowNode[] = [];
  const edges: Edge[] = [];
  const rowsByDepth = new Map<number, number>();

  const visit = (item: MapItem, depth: number, parentId?: string) => {
    const row = rowsByDepth.get(depth) ?? 0;
    rowsByDepth.set(depth, row + 1);

    nodes.push({
      id: item.id,
      type: "mindMap",
      position: { x: depth * 330, y: (row - 2) * 128 },
      data: {
        item,
        depth,
        expanded: expandedIds.has(item.id),
        selected: selectedId === item.id,
        onToggle,
      },
    });

    if (parentId) {
      const active = parentId === selectedId || item.id === selectedId;
      edges.push({
        id: `${parentId}-${item.id}`,
        source: parentId,
        target: item.id,
        type: active ? "highlight" : "default",
        style: {
          stroke: active ? "var(--foreground)" : "var(--border)",
          strokeWidth: active ? 2.5 : 1.5,
        },
      });
    }

    if (expandedIds.has(item.id)) {
      item.children.forEach((child) => visit(child, depth + 1, item.id));
    }
  };

  visit(root, 0);
  return { nodes, edges };
}

function MindMapFlow({ content, materialTitle }: MindMapViewProps) {
  const { root, depths } = useMemo(() => createTree(content), [content]);
  const rootId = root?.id ?? null;
  const [expandedIds, setExpandedIds] = useState(() => new Set(rootId ? [rootId] : []));
  const [selectedId, setSelectedId] = useState<string | null>(rootId);
  const [viewportFocus, setViewportFocus] = useState<{
    id: string;
    childrenOnly: boolean;
  } | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<MindMapFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();

  useEffect(() => {
    setExpandedIds(new Set(rootId ? [rootId] : []));
    setSelectedId(rootId);
  }, [content, rootId]);

  const toggleNode = useCallback(
    (id: string) => {
      setSelectedId(id);
      const isCollapsing = expandedIds.has(id);
      setViewportFocus({ id, childrenOnly: !isCollapsing });
      setExpandedIds((current) => {
        const next = new Set(current);
        if (next.has(id)) {
          next.delete(id);
        } else {
          const depth = depths.get(id);
          if (depth !== undefined) {
            for (const [candidateId, candidateDepth] of depths) {
              if (candidateDepth === depth && candidateId !== id) next.delete(candidateId);
            }
          }
          next.add(id);
        }
        return next;
      });
    },
    [depths, expandedIds],
  );

  const selectLeaf = useCallback(
    (item: MapItem) => {
      setSelectedId(item.id);
      if (item.children.length > 0) {
        toggleNode(item.id);
        return;
      }

      const prompt = `I'm studying the mind-map concept "${item.label}"${materialTitle ? ` from the study material "${materialTitle}"` : ""}.\n\nPlease explain this concept in depth with practical examples, related ideas, and key insights I should remember.`;
      window.dispatchEvent(
        new CustomEvent("send-chat-prompt", {
          detail: {
            prompt,
            autoSend: true,
            focusChat: true,
            concept: item.label,
          },
        }),
      );
    },
    [materialTitle, toggleNode],
  );

  const graph = useMemo(
    () => (root ? buildGraph(root, expandedIds, selectedId, toggleNode) : { nodes: [], edges: [] }),
    [expandedIds, root, selectedId, toggleNode],
  );

  useEffect(() => setNodes(graph.nodes), [graph.nodes, setNodes]);
  useEffect(() => setEdges(graph.edges), [graph.edges, setEdges]);
  useEffect(() => {
    const timeout = window.setTimeout(() => fitView({ duration: 450, padding: 0.24 }), 150);
    return () => window.clearTimeout(timeout);
  }, [content, fitView]);

  useEffect(() => {
    if (!viewportFocus) return;

    const focusNodeIds = new Set<string>();
    if (!viewportFocus.childrenOnly) focusNodeIds.add(viewportFocus.id);
    graph.edges.forEach((edge) => {
      if (edge.source === viewportFocus.id) focusNodeIds.add(edge.target);
    });
    if (focusNodeIds.size === 0) focusNodeIds.add(viewportFocus.id);

    const focusNodes = graph.nodes
      .filter((node) => focusNodeIds.has(node.id))
      .map((node) => ({ id: node.id }));
    if (focusNodes.length === 0) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timeout = window.setTimeout(() => {
      fitView({
        nodes: focusNodes,
        padding: 0.35,
        duration: reducedMotion ? 0 : 450,
      });
      setViewportFocusId(null);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fitView, graph.edges, graph.nodes, viewportFocus]);

  const centerSelected = () => {
    const node = nodes.find((candidate) => candidate.id === selectedId);
    if (node) {
      setCenter(node.position.x + 100, node.position.y + 40, { zoom: 1.05, duration: 500 });
    } else {
      fitView({ duration: 500, padding: 0.24 });
    }
  };

  if (!root) {
    return <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">This mind map has no connected nodes yet.</div>;
  }

  return (
    <div className="relative h-[min(680px,calc(100vh-180px))] min-h-[420px] w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => selectLeaf(node.data.item)}
        onInit={(instance) => window.setTimeout(() => instance.fitView({ padding: 0.24 }), 100)}
        fitView
        minZoom={0.35}
        maxZoom={1.7}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} className="opacity-60" />
      </ReactFlow>

      <div className="absolute right-4 top-4 flex flex-col gap-1.5 rounded-xl border border-border bg-card/95 p-1.5 shadow-sm backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={() => zoomIn({ duration: 300 })} className="size-8 text-muted-foreground" aria-label="Zoom in"><Plus className="size-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => zoomOut({ duration: 300 })} className="size-8 text-muted-foreground" aria-label="Zoom out"><Minus className="size-4" /></Button>
        <div className="mx-1 h-px bg-border" />
        <Button variant="ghost" size="icon" onClick={centerSelected} className="size-8 text-muted-foreground" aria-label="Center selected node"><Crosshair className="size-4" /></Button>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 hidden items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-2 text-[10px] text-muted-foreground backdrop-blur-md sm:flex">
        <span className="size-1.5 rounded-full bg-primary" /> Drag to pan · Scroll to zoom · Click a node to explore
      </div>
    </div>
  );
}

export function MindMapView(props: MindMapViewProps) {
  return (
    <ReactFlowProvider>
      <MindMapFlow {...props} />
    </ReactFlowProvider>
  );
}
