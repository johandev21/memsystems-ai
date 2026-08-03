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
import {
  ArrowUpRight,
  ChevronRight,
  Crosshair,
  Layers3,
  Maximize2,
  MessageCircle,
  Minus,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export const Route = createFileRoute("/prototype/mind-map")({
  component: PrototypeMindMapPage,
});

type MapItem = {
  id: string;
  label: string;
  detail?: string;
  children?: MapItem[];
};

const MIND_MAP: MapItem = {
  id: "clean-code",
  label: "Clean Code",
  detail: "A practical map of principles for writing software that stays easy to change.",
  children: [
    {
      id: "meaningful-naming",
      label: "Meaningful Naming",
      detail: "Names should reveal intent, remove ambiguity, and make the code read like a domain model.",
      children: [
        { id: "reveal-intent", label: "Reveal intent", detail: "Choose names that explain why a value exists." },
        { id: "avoid-disinformation", label: "Avoid disinformation", detail: "Do not use names that suggest a false type or behavior." },
        { id: "one-word-one-concept", label: "One word, one concept", detail: "Use consistent vocabulary across the codebase." },
      ],
    },
    {
      id: "functions",
      label: "Functions",
      detail: "Small, focused functions make behavior easier to understand and test.",
      children: [
        { id: "small", label: "Keep them small", detail: "A function should do one thing and do it well." },
        { id: "single-level", label: "Single level of abstraction", detail: "Avoid mixing high-level intent with implementation detail." },
        { id: "fewer-arguments", label: "Fewer arguments", detail: "Prefer clear inputs over long positional argument lists." },
      ],
    },
    {
      id: "comments",
      label: "Comments",
      detail: "Use comments to explain intent or constraints, not to excuse confusing code.",
      children: [
        { id: "why-not-what", label: "Explain why, not what", detail: "The code should explain what it does." },
        { id: "legal-comments", label: "Legal comments", detail: "Keep required notices visible and accurate." },
      ],
    },
    {
      id: "error-handling",
      label: "Error Handling",
      detail: "Errors are part of the normal flow and deserve a clear, consistent strategy.",
      children: [
        { id: "exceptions", label: "Use exceptions", detail: "Keep error paths separate from the happy path." },
        { id: "null-is-not-an-error", label: "Avoid null", detail: "Reduce the surface area for accidental null behavior." },
      ],
    },
    {
      id: "testing",
      label: "Testing",
      detail: "Fast, focused tests protect behavior and make refactoring safe.",
      children: [
        { id: "one-concept", label: "One concept per test", detail: "A test should make one failure easy to diagnose." },
        { id: "fast-tests", label: "Fast tests", detail: "Keep the feedback loop short enough to use constantly." },
      ],
    },
  ],
};

type MindMapNodeData = {
  item: MapItem;
  depth: number;
  expanded: boolean;
  selected: boolean;
  onToggle: (id: string) => void;
  onSelect: (item: MapItem) => void;
};

type MindMapNode = Node<MindMapNodeData, "mindMap">;

function MindMapNodeCard({ data }: NodeProps<MindMapNode>) {
  const isRoot = data.depth === 0;
  const hasChildren = Boolean(data.item.children?.length);

  return (
    <div
      className={cn(
        "group relative min-w-[190px] max-w-[230px] rounded-lg border px-4 py-3 text-left shadow-sm transition-all duration-200",
        isRoot
          ? "min-w-[210px] rounded-full border-primary bg-primary text-primary-foreground"
          : data.selected
            ? "border-primary bg-card ring-1 ring-primary"
            : "border-border bg-card hover:border-foreground/30",
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-1 !w-1 !border-0 !bg-transparent" />
      <div className="flex items-center gap-2">
        {isRoot ? <Sparkles className="size-4 shrink-0" /> : <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
        <span className="text-sm font-semibold leading-tight">
          {data.item.label}
        </span>
      </div>
      {!isRoot && data.item.detail && (
        <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">{data.item.detail}</p>
      )}
      {hasChildren && (
        <button
          type="button"
          aria-label={data.expanded ? `Collapse ${data.item.label}` : `Expand ${data.item.label}`}
          onClick={(event) => {
            event.stopPropagation();
            data.onToggle(data.item.id);
          }}
          className={cn(
            "absolute -right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground",
            isRoot ? "border-primary/30" : "",
          )}
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

const nodeTypes = { mindMap: MindMapNodeCard };
const edgeTypes = { highlight: HighlightEdge };

function flattenMap(root: MapItem) {
  const byId = new Map<string, { item: MapItem; depth: number; parentId?: string }>();
  const walk = (item: MapItem, depth: number, parentId?: string) => {
    byId.set(item.id, { item, depth, parentId });
    item.children?.forEach((child) => walk(child, depth + 1, item.id));
  };
  walk(root, 0);
  return byId;
}

function buildVisibleGraph(
  root: MapItem,
  expandedIds: Set<string>,
  selectedId: string | null,
  onToggle: (id: string) => void,
  onSelect: (item: MapItem) => void,
) {
  const nodes: MindMapNode[] = [];
  const edges: Edge[] = [];
  const visibleByDepth = new Map<number, number>();

  const walk = (item: MapItem, depth: number, parentId?: string) => {
    const row = visibleByDepth.get(depth) ?? 0;
    visibleByDepth.set(depth, row + 1);
    const y = (row - 2) * 128;
    const x = depth * 330;
    const expanded = expandedIds.has(item.id);

    nodes.push({
      id: item.id,
      type: "mindMap",
      position: { x, y },
      data: {
        item,
        depth,
        expanded,
        selected: selectedId === item.id,
        onToggle,
        onSelect,
      },
    });

    if (parentId) {
      const active = selectedId === item.id || selectedId === parentId;
      edges.push({
        id: `${parentId}-${item.id}`,
        source: parentId,
        target: item.id,
        type: active ? "highlight" : "default",
        style: {
          stroke: active ? "var(--foreground)" : "var(--border)",
          strokeWidth: active ? 2.5 : 1.5,
          opacity: active ? 1 : 0.9,
        },
      });
    }

    if (expanded) item.children?.forEach((child) => walk(child, depth + 1, item.id));
  };

  walk(root, 0);
  return { nodes, edges };
}

function MindMapCanvas({ onLeafSelect }: { onLeafSelect: (item: MapItem) => void }) {
  const [expandedIds, setExpandedIds] = useState(() => new Set([MIND_MAP.id]));
  const [selectedId, setSelectedId] = useState<string | null>(MIND_MAP.id);
  const mapIndex = useMemo(() => flattenMap(MIND_MAP), []);
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();

  const selectNode = useCallback(
    (item: MapItem) => {
      setSelectedId(item.id);
      if (!item.children?.length) onLeafSelect(item);
    },
    [onLeafSelect],
  );

  const toggleNode = useCallback(
    (id: string) => {
      const node = mapIndex.get(id);
      if (!node?.item.children?.length) return;
      setSelectedId(id);
      setExpandedIds((previous) => {
        const next = new Set(previous);
        if (next.has(id)) {
          next.delete(id);
        } else {
          for (const [candidateId, candidate] of mapIndex) {
            if (candidate.depth === node.depth && candidateId !== id) next.delete(candidateId);
          }
          next.add(id);
        }
        return next;
      });
      window.setTimeout(() => fitView({ duration: 550, padding: 0.24 }), 30);
    },
    [fitView, mapIndex],
  );

  const graph = useMemo(
    () => buildVisibleGraph(MIND_MAP, expandedIds, selectedId, toggleNode, selectNode),
    [expandedIds, selectNode, selectedId, toggleNode],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState<MindMapNode>(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  useEffect(() => setNodes(graph.nodes), [graph.nodes, setNodes]);
  useEffect(() => setEdges(graph.edges), [graph.edges, setEdges]);
  useEffect(() => {
    const timeout = window.setTimeout(() => fitView({ duration: 450, padding: 0.24 }), 150);
    return () => window.clearTimeout(timeout);
  }, [fitView]);

  const recenterSelected = () => {
    const node = nodes.find((candidate) => candidate.id === selectedId);
    if (node) setCenter(node.position.x + 100, node.position.y + 40, { zoom: 1.05, duration: 500 });
    else fitView({ duration: 500, padding: 0.24 });
  };

  return (
    <div className="relative h-full min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => selectNode(node.data.item)}
        onInit={(instance) => window.setTimeout(() => instance.fitView({ padding: 0.24 }), 60)}
        fitView
        minZoom={0.35}
        maxZoom={1.7}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        proOptions={{ hideAttribution: true }}
        className="mind-map-flow"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(148,163,184,0.13)" />
      </ReactFlow>

      <div className="absolute right-4 top-4 flex flex-col gap-1.5 rounded-xl border border-border bg-card/95 p-1.5 shadow-sm backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={() => zoomIn({ duration: 300 })} className="size-8 text-muted-foreground" aria-label="Zoom in">
          <Plus className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => zoomOut({ duration: 300 })} className="size-8 text-muted-foreground" aria-label="Zoom out">
          <Minus className="size-4" />
        </Button>
        <div className="mx-1 h-px bg-white/10" />
        <Button variant="ghost" size="icon" onClick={recenterSelected} className="size-8 text-muted-foreground" aria-label="Center selected node">
          <Crosshair className="size-4" />
        </Button>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 hidden items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-2 text-[10px] text-muted-foreground backdrop-blur-md sm:flex">
        <span className="size-1.5 rounded-full bg-primary" /> Drag to pan · Scroll to zoom · Click a node to inspect
      </div>
    </div>
  );
}

function PrototypeMindMapPage() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatItem, setChatItem] = useState<MapItem | null>(null);

  return (
    <main className="min-h-screen bg-background px-3 py-3 font-sans text-foreground sm:px-5 sm:py-5">
      <section className={cn("mx-auto flex h-[calc(100vh-24px)] max-w-[1500px] flex-col overflow-hidden rounded-2xl border border-border bg-card", isExpanded && "h-[calc(100vh-40px)]") }>
        <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground"><Layers3 className="size-4" /></div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">Mind Map Explorer</h1>
                <Badge variant="outline" className="hidden text-[9px] font-mono uppercase sm:inline-flex">Prototype</Badge>
              </div>
              <p className="truncate text-[11px] text-muted-foreground">Clean Code · 5 branches · 14 concepts</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded((value) => !value)} className="gap-2 text-xs text-muted-foreground">
            {isExpanded ? <ArrowUpRight className="size-3.5 rotate-180" /> : <Maximize2 className="size-3.5" />}
            <span className="hidden sm:inline">{isExpanded ? "Exit canvas" : "Expand viewer"}</span>
          </Button>
        </header>

        <div className="relative h-full min-h-0 flex-1">
          <ReactFlowProvider>
            <MindMapCanvas onLeafSelect={setChatItem} />
          </ReactFlowProvider>
          {chatItem && (
            <aside className="absolute bottom-4 right-4 z-20 w-[min(360px,calc(100%-32px))] rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-xl animate-in slide-in-from-right-3 duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold"><MessageCircle className="size-4 text-primary" /> Chat context</div>
                <button type="button" onClick={() => setChatItem(null)} className="text-muted-foreground hover:text-foreground" aria-label="Close chat context"><X className="size-4" /></button>
              </div>
              <p className="mt-3 rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">Discuss what these sources say about <span className="font-semibold text-foreground">{chatItem.label}</span>...</p>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground"><Search className="size-3" /> Sources panel ready · context attached</div>
            </aside>
          )}
        </div>
      </section>
    </main>
  );
}
