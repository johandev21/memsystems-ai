import { hierarchy, tree } from "d3-hierarchy";
import type { MindMapEdgeData, MindMapNodeData } from "./MindMapView";

export interface HierarchicalData {
  id: string;
  label: string;
  color?: string;
  children?: HierarchicalData[];
}

export interface LayoutedElementsOptions {
  direction?: "TB" | "LR";
  nodeWidth?: number;
  nodeHeight?: number;
}

export function getLayoutedElements(
  rawNodes: MindMapNodeData[],
  rawEdges: MindMapEdgeData[],
  collapsedNodeIds: Set<string>,
  selectedNodeId: string | null,
  focusMode: boolean,
  options: LayoutedElementsOptions = {},
) {
  const { direction = "LR", nodeWidth = 200, nodeHeight = 80 } = options;

  if (rawNodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  // 1. Build Adjacency List & Parent Map
  const adj: Record<string, string[]> = {};
  const parentMap: Record<string, string> = {};

  for (const node of rawNodes) {
    adj[node.id] = [];
  }

  for (const edge of rawEdges) {
    if (adj[edge.sourceId] && adj[edge.targetId]) {
      adj[edge.sourceId].push(edge.targetId);
      parentMap[edge.targetId] = edge.sourceId;
    }
  }

  // Determine Root Node
  let rootNodeId = rawNodes[0]?.id;
  const roots = rawNodes.filter((node) => !parentMap[node.id]);
  if (roots.length > 0 && roots[0]) {
    rootNodeId = roots[0].id;
  }

  if (!rootNodeId) {
    return { nodes: [], edges: [] };
  }

  // 2. Build the Hierarchical Tree structure recursively, respecting collapse states
  const visited = new Set<string>();

  const buildTree = (id: string): HierarchicalData | null => {
    if (visited.has(id)) return null;
    visited.add(id);

    const node = rawNodes.find((n) => n.id === id);
    if (!node) return null;

    const childrenIds = adj[id] || [];
    const children: HierarchicalData[] = [];

    // Only recurse children if this node is NOT collapsed
    if (!collapsedNodeIds.has(id)) {
      for (const childId of childrenIds) {
        const childTree = buildTree(childId);
        if (childTree) {
          children.push(childTree);
        }
      }
    }

    return {
      id: node.id,
      label: node.label,
      color: node.color,
      children: children.length > 0 ? children : undefined,
    };
  };

  const treeData = buildTree(rootNodeId);
  if (!treeData) {
    return { nodes: [], edges: [] };
  }

  // 3. Compute D3 tree layout
  const d3Root = hierarchy(treeData);

  // D3 tree spacing.
  // In 'LR' mode: D3 x maps to React Flow y, D3 y maps to React Flow x.
  // So the node size arguments should be [siblingVerticalGap, layerHorizontalGap].
  const d3Tree = tree<HierarchicalData>().nodeSize(
    direction === "LR" ? [nodeHeight, nodeWidth] : [nodeWidth, nodeHeight],
  );

  d3Tree(d3Root);

  // Collect all visible nodes from the D3 tree traversal
  const visibleNodes = new Set<string>();
  d3Root.descendants().forEach((d) => {
    visibleNodes.add(d.data.id);
  });

  // Determine focused nodes if focusMode is on
  const focusedNodeIds = new Set<string>();
  if (focusMode && selectedNodeId) {
    focusedNodeIds.add(selectedNodeId);

    // Add ancestors up to the root
    let curr: string | undefined = selectedNodeId;
    while (curr) {
      focusedNodeIds.add(curr);
      curr = parentMap[curr];
    }

    // Add immediate children
    const children = adj[selectedNodeId] || [];
    for (const cid of children) {
      focusedNodeIds.add(cid);
    }
  }

  // Map D3 layout nodes to React Flow nodes
  const rfNodes = d3Root.descendants().map((d) => {
    const isSelected = selectedNodeId === d.data.id;
    const isCollapsed = collapsedNodeIds.has(d.data.id);
    const hasChildren = (adj[d.data.id]?.length || 0) > 0;
    const isFocused = !focusMode || focusedNodeIds.has(d.data.id);

    // Coordinate mapping based on layout direction.
    // For LR, d.y is depth (layer horizontal) and d.x is vertical index.
    // For TB, d.x is horizontal index and d.y is depth (layer vertical).
    /* biome-ignore lint/suspicious/noExplicitAny: D3 hierarchy node requires typecast to access mutated position coords */
    const pd = d as any;
    const x = direction === "LR" ? (pd.y ?? 0) : (pd.x ?? 0);
    const y = direction === "LR" ? (pd.x ?? 0) : (pd.y ?? 0);

    return {
      id: d.data.id,
      type: "custom",
      position: { x: x as number, y: y as number },
      data: {
        label: d.data.label,
        color: d.data.color,
        hasChildren,
        isCollapsed,
        isSelected,
        isFocused,
      },
    };
  });

  // Map raw edges to React Flow edges if both source and target are visible
  const rfEdges = rawEdges.flatMap((edge) => {
    if (!visibleNodes.has(edge.sourceId) || !visibleNodes.has(edge.targetId)) {
      return [];
    }
    const isEdgeSelected =
      selectedNodeId === edge.sourceId || selectedNodeId === edge.targetId;
    const isEdgeFocused =
      !focusMode ||
      (focusedNodeIds.has(edge.sourceId) && focusedNodeIds.has(edge.targetId));

    return [
      {
        id: edge.id,
        source: edge.sourceId,
        target: edge.targetId,
        type: "smoothstep",
        animated: isEdgeSelected,
        style: {
          stroke: isEdgeSelected ? "var(--primary)" : "var(--border)",
          strokeWidth: isEdgeSelected ? 2 : 1.5,
          opacity: isEdgeFocused ? 1 : 0.15,
          transition: "opacity 0.25s, stroke 0.25s",
        },
      },
    ];
  });

  return { nodes: rfNodes, edges: rfEdges };
}
