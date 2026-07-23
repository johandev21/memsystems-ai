import {
  Background,
  BackgroundVariant,
  type Edge,
  MiniMap,
  type Node,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import "@xyflow/react/dist/style.css";

import {
  Focus,
  Info,
  Maximize2,
  Minimize2,
  Network,
  RotateCcw,
  Search,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/utils";
import { getLayoutedElements } from "./layout-utils";
import { MindMapCustomNode } from "./MindMapCustomNode";

export interface MindMapNodeData {
  id: string;
  label: string;
  color?: string;
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
  content: {
    rootId?: string;
    nodes: MindMapNodeData[];
    edges: MindMapEdgeData[];
  };
}

const nodeTypes = {
  custom: MindMapCustomNode,
};

const getClosestNodeInDirection = (
  currentNode: { id: string; position: { x: number; y: number } },
  allNodes: { id: string; position: { x: number; y: number } }[],
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT",
) => {
  const curX = currentNode.position.x;
  const curY = currentNode.position.y;

  let candidates = allNodes.filter((n) => n.id !== currentNode.id);

  if (direction === "RIGHT") {
    candidates = candidates.filter((n) => n.position.x > curX + 10);
  } else if (direction === "LEFT") {
    candidates = candidates.filter((n) => n.position.x < curX - 10);
  } else if (direction === "DOWN") {
    candidates = candidates.filter((n) => n.position.y > curY + 10);
  } else if (direction === "UP") {
    candidates = candidates.filter((n) => n.position.y < curY - 10);
  }

  if (candidates.length === 0) return null;

  let best: (typeof candidates)[0] | null = null;
  let minDist = Infinity;

  for (const cand of candidates) {
    const dx = cand.position.x - curX;
    const dy = cand.position.y - curY;
    const dist = dx * dx + dy * dy;
    if (dist < minDist) {
      minDist = dist;
      best = cand;
    }
  }

  return best;
};

interface MindMapDetailsCardProps {
  selectedNode: MindMapNodeData;
  selectedNodeParent: MindMapNodeData | null;
  selectedNodeChildren: (MindMapNodeData | undefined)[];
  setSelectedNodeId: (id: string | null) => void;
}

function MindMapDetailsCard({
  selectedNode,
  selectedNodeParent,
  selectedNodeChildren,
  setSelectedNodeId,
}: MindMapDetailsCardProps) {
  return (
    <Card className="p-4 border border-border bg-card shadow-sm space-y-3 animate-in slide-in-from-bottom-2 duration-200 shrink-0">
      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
        <Network className="h-4 w-4 text-primary" />
        <span>Concept Details</span>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground">
          {selectedNode.label}
        </h3>
        {selectedNodeParent && (
          <p className="text-[11px] text-muted-foreground">
            Parent:{" "}
            <button
              type="button"
              onClick={() => setSelectedNodeId(selectedNodeParent.id)}
              className="text-primary hover:underline font-semibold cursor-pointer"
            >
              {selectedNodeParent.label}
            </button>
          </p>
        )}
      </div>

      {selectedNodeChildren.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Sub-concepts ({selectedNodeChildren.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {selectedNodeChildren.map((child) => {
              if (!child) return null;
              return (
                <Button
                  key={child.id}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedNodeId(child.id)}
                  className="h-6 text-[10px] font-medium border border-border/20 px-2.5 cursor-pointer rounded-full"
                >
                  {child.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

interface MindMapControlPanelsProps {
  direction: "LR" | "TB";
  setDirection: (dir: "LR" | "TB") => void;
  focusMode: boolean;
  setFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isFullscreen: boolean;
  setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
  fitView: (options?: any) => void;
}

function MindMapControlPanels({
  direction,
  setDirection,
  focusMode,
  setFocusMode,
  searchQuery,
  setSearchQuery,
  isFullscreen,
  setIsFullscreen,
  fitView,
}: MindMapControlPanelsProps) {
  return (
    <>
      <Panel
        position="top-left"
        className="flex items-center gap-1.5 bg-background/95 backdrop-blur-sm p-1.5 rounded-2xl border border-border/80 shadow-sm"
      >
        <Button
          type="button"
          variant={direction === "LR" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setDirection("LR")}
          className="h-7 px-2.5 text-xs font-semibold cursor-pointer"
          title="Horizontal layout"
        >
          Horizontal
        </Button>
        <Button
          type="button"
          variant={direction === "TB" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setDirection("TB")}
          className="h-7 px-2.5 text-xs font-semibold cursor-pointer"
          title="Vertical layout"
        >
          Vertical
        </Button>
        <div className="h-4 w-px bg-border/60 mx-1" />
        <Button
          type="button"
          variant={focusMode ? "default" : "ghost"}
          size="sm"
          onClick={() => setFocusMode((f) => !f)}
          className={cn(
            "h-7 px-2.5 text-xs font-semibold gap-1 cursor-pointer",
            focusMode && "bg-primary text-primary-foreground",
          )}
          title="Focus mode (dim unselected branches)"
        >
          <Focus className="h-3.5 w-3.5" />
          Focus
        </Button>
      </Panel>

      <Panel
        position="top-right"
        className="flex items-center gap-1.5 bg-background/95 backdrop-blur-sm px-2.5 py-1.5 rounded-2xl border border-border/80 shadow-sm w-60"
      >
        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Input
          type="text"
          placeholder="Search concepts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-6 text-xs bg-transparent border-none p-0 focus-visible:ring-0 shadow-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="text-[10px] text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
          >
            Clear
          </button>
        )}
      </Panel>

      <Panel
        position="bottom-right"
        className="flex items-center gap-1 bg-background/95 backdrop-blur-sm p-1.5 rounded-2xl border border-border/80 shadow-sm"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 cursor-pointer"
          onClick={() => fitView({ duration: 300 })}
          title="Recenter view"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 cursor-pointer"
          onClick={() => setIsFullscreen((f) => !f)}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </Panel>

      <Panel
        position="bottom-left"
        className="flex items-center gap-1 text-[10px] text-muted-foreground/80 bg-background/95 backdrop-blur-sm px-2.5 py-1.5 rounded-xl border border-border/50 font-medium max-w-xs shadow-sm"
      >
        <Info className="h-3.5 w-3.5 mr-1 text-primary shrink-0" />
        <span>Click nodes to select. Use arrow keys to navigate. Space to expand/collapse.</span>
      </Panel>
    </>
  );
}

type FlowState = {
  selectedNodeId: string | null;
  collapsedNodeIds: Set<string>;
  focusMode: boolean;
  searchQuery: string;
};

type FlowAction =
  | { type: "RESET"; initialRoot: string | null }
  | { type: "SET_SELECTED_NODE_ID"; id: string | null }
  | { type: "TOGGLE_COLLAPSE"; id: string }
  | { type: "SET_FOCUS_MODE"; mode: boolean }
  | { type: "TOGGLE_FOCUS_MODE" }
  | { type: "SET_SEARCH_QUERY"; query: string };

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "RESET":
      return {
        selectedNodeId: action.initialRoot,
        collapsedNodeIds: new Set(),
        focusMode: false,
        searchQuery: "",
      };
    case "SET_SELECTED_NODE_ID":
      return { ...state, selectedNodeId: action.id };
    case "TOGGLE_COLLAPSE": {
      const next = new Set(state.collapsedNodeIds);
      if (next.has(action.id)) {
        next.delete(action.id);
      } else {
        next.add(action.id);
      }
      return { ...state, collapsedNodeIds: next };
    }
    case "SET_FOCUS_MODE":
      return { ...state, focusMode: action.mode };
    case "TOGGLE_FOCUS_MODE":
      return { ...state, focusMode: !state.focusMode };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.query };
    default:
      return state;
  }
}

function MindMapFlow({ materialId: _materialId, content }: MindMapViewProps) {
  const rawNodes = useMemo(() => content.nodes ?? [], [content.nodes]);
  const rawEdges = useMemo(() => content.edges ?? [], [content.edges]);

  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [state, dispatch] = useReducer(flowReducer, {
    selectedNodeId:
      content.rootId || (content.nodes && content.nodes[0]?.id) || null,
    collapsedNodeIds: new Set<string>(),
    focusMode: false,
    searchQuery: "",
  });
  const { selectedNodeId, collapsedNodeIds, focusMode, searchQuery } = state;
  const [direction, setDirection] = useState<"LR" | "TB">("LR");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [prevContent, setPrevContent] = useState(content);
  if (content !== prevContent) {
    setPrevContent(content);
    dispatch({
      type: "RESET",
      initialRoot:
        content.rootId || (content.nodes && content.nodes[0]?.id) || null,
    });
  }

  const setSelectedNodeId = useCallback((id: string | null) => {
    dispatch({ type: "SET_SELECTED_NODE_ID", id });
  }, []);

  const setFocusMode = useCallback(
    (modeOrFn: boolean | ((prev: boolean) => boolean)) => {
      if (typeof modeOrFn === "function") {
        dispatch({ type: "TOGGLE_FOCUS_MODE" });
      } else {
        dispatch({ type: "SET_FOCUS_MODE", mode: modeOrFn });
      }
    },
    [],
  );

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: "SET_SEARCH_QUERY", query });
  }, []);

  const { adjacencyList, parentMap } = useMemo(() => {
    const adj: Record<string, string[]> = {};
    const parents: Record<string, string> = {};

    for (const node of rawNodes) {
      adj[node.id] = [];
    }
    for (const edge of rawEdges) {
      if (adj[edge.sourceId] && adj[edge.targetId]) {
        adj[edge.sourceId].push(edge.targetId);
        parents[edge.targetId] = edge.sourceId;
      }
    }
    return { adjacencyList: adj, parentMap: parents };
  }, [rawNodes, rawEdges]);

  const handleToggleCollapse = useCallback(
    (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      dispatch({ type: "TOGGLE_COLLAPSE", id });
    },
    [],
  );

  const updateLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      rawNodes,
      rawEdges,
      collapsedNodeIds,
      selectedNodeId,
      focusMode,
      { direction, nodeWidth: 220, nodeHeight: 90 },
    );

    const query = searchQuery.trim().toLowerCase();
    const processedNodes = layoutedNodes.map((n) => {
      const matchesSearch = query
        ? n.data.label.toLowerCase().includes(query)
        : true;
      const isFocused = n.data.isFocused && matchesSearch;

      return {
        ...n,
        data: {
          ...n.data,
          direction,
          onToggleCollapse: handleToggleCollapse,
          isFocused,
          isHighlighted: query && matchesSearch,
        },
      };
    });

    setNodes(processedNodes);
    setEdges(layoutedEdges);
  }, [
    rawNodes,
    rawEdges,
    collapsedNodeIds,
    selectedNodeId,
    focusMode,
    direction,
    searchQuery,
    handleToggleCollapse,
    setNodes,
    setEdges,
  ]);

  useEffect(() => {
    updateLayout();
  }, [updateLayout]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.15, duration: 300 });
    }, 50);
    return () => clearTimeout(timer);
  }, [collapsedNodeIds, direction, focusMode, fitView]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (!selectedNodeId) return;
      const currentRfNode = nodes.find((n) => n.id === selectedNodeId);
      if (!currentRfNode) return;

      let dir: "UP" | "DOWN" | "LEFT" | "RIGHT" | null = null;
      if (e.key === "ArrowUp") dir = "UP";
      else if (e.key === "ArrowDown") dir = "DOWN";
      else if (e.key === "ArrowLeft") dir = "LEFT";
      else if (e.key === "ArrowRight") dir = "RIGHT";

      if (dir) {
        e.preventDefault();
        const next = getClosestNodeInDirection(currentRfNode, nodes, dir);
        if (next) {
          setSelectedNodeId(next.id);
        }
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggleCollapse(selectedNodeId);
      }
    },
    [nodes, selectedNodeId, handleToggleCollapse, setSelectedNodeId],
  );

  const selectedNode = rawNodes.find((n) => n.id === selectedNodeId);
  const selectedNodeChildren = useMemo(() => {
    if (!selectedNodeId) return [];
    return (adjacencyList[selectedNodeId] || []).flatMap((id) => {
      const found = rawNodes.find((n) => n.id === id);
      return found ? [found] : [];
    });
  }, [selectedNodeId, adjacencyList, rawNodes]);

  const selectedNodeParent = useMemo(() => {
    if (!selectedNodeId || !parentMap[selectedNodeId]) return null;
    return rawNodes.find((n) => n.id === parentMap[selectedNodeId]) || null;
  }, [selectedNodeId, parentMap, rawNodes]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  return (
    <div
      role="application"
      className={cn(
        "flex flex-col gap-4 animate-in fade-in duration-200 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        isFullscreen &&
          "fixed inset-0 z-50 bg-background p-6 w-screen h-screen overflow-hidden",
      )}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <Card
        className={cn(
          "relative w-full overflow-hidden border border-border bg-card shadow-sm flex flex-col transition-all duration-300",
          isFullscreen ? "flex-1 h-full" : "h-[450px]",
        )}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          colorMode="system"
          className="flex-1 w-full h-full"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            className="opacity-75"
          />

          <MindMapControlPanels
            direction={direction}
            setDirection={setDirection}
            focusMode={focusMode}
            setFocusMode={setFocusMode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
            fitView={fitView}
          />

          <MiniMap
            nodeStrokeColor={(n) => (n.data?.color as string) || "#4f46e5"}
            nodeColor={(n) => (n.data?.color as string) || "#4f46e5"}
            maskColor="rgba(0, 0, 0, 0.08)"
            style={{ width: 100, height: 70 }}
            className="border border-border/60 rounded-2xl bg-card/65"
          />
        </ReactFlow>
      </Card>

      {selectedNode && (
        <MindMapDetailsCard
          selectedNode={selectedNode}
          selectedNodeParent={selectedNodeParent}
          selectedNodeChildren={selectedNodeChildren}
          setSelectedNodeId={setSelectedNodeId}
        />
      )}
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
