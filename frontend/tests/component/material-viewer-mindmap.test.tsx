// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock React Flow to bypass layout measurements in JSDOM
vi.mock("@xyflow/react", () => {
  return {
    ReactFlow: ({
      children,
      nodes,
      nodeTypes,
      onNodeClick,
    }: {
      children: React.ReactNode;
      nodes: unknown[];
      /* biome-ignore lint/suspicious/noExplicitAny: React Flow nodes mock type */
      nodeTypes: Record<string, React.ComponentType<any>>;
      /* biome-ignore lint/suspicious/noExplicitAny: React Flow click handler type */
      onNodeClick: (e: React.MouseEvent, node: any) => void;
    }) => {
      return (
        <div data-testid="rf-mock">
          {nodes.map((nodeAny) => {
            /* biome-ignore lint/suspicious/noExplicitAny: Mock node properties */
            const n = nodeAny as any;
            const NodeComp = nodeTypes[n.type || "custom"];
            return (
              // biome-ignore lint/a11y/useKeyWithClickEvents: Mock node wrapper in tests
              // biome-ignore lint/a11y/noStaticElementInteractions: Mock node wrapper in tests
              <div
                key={n.id}
                data-testid={`node-wrapper-${n.id}`}
                onClick={(e) => onNodeClick?.(e, n)}
              >
                <NodeComp id={n.id} data={n.data} />
              </div>
            );
          })}
          {children}
        </div>
      );
    },
    ReactFlowProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="rf-provider">{children}</div>
    ),
    Handle: () => <div data-testid="rf-handle" />,
    MiniMap: () => <div data-testid="rf-minimap" />,
    Controls: () => <div data-testid="rf-controls" />,
    Background: () => <div data-testid="rf-background" />,
    Panel: ({
      children,
      position,
    }: {
      children: React.ReactNode;
      position: string;
    }) => <div data-testid={`rf-panel-${position}`}>{children}</div>,
    useNodesState: (initial: unknown) => {
      const [s, setS] = React.useState(initial);
      return [s, setS, vi.fn()];
    },
    useEdgesState: (initial: unknown) => {
      const [s, setS] = React.useState(initial);
      return [s, setS, vi.fn()];
    },
    useReactFlow: () => ({
      fitView: vi.fn(),
    }),
    Position: {
      Left: "left",
      Right: "right",
      Top: "top",
      Bottom: "bottom",
    },
    BackgroundVariant: {
      Lines: "lines",
      Dots: "dots",
      Cross: "cross",
    },
  };
});

import { getLayoutedElements } from "@/features/study-materials/components/viewer/layout-utils";
import { MindMapView } from "@/features/study-materials/components/viewer/MindMapView";

const mockContent = {
  rootId: "n-root",
  nodes: [
    { id: "n-root", label: "Root Concept", color: "#ff0000" },
    { id: "n-child-1", label: "Child Concept A", color: "#00ff00" },
    { id: "n-child-2", label: "Child Concept B", color: "#0000ff" },
    { id: "n-grandchild-1", label: "Grandchild Concept A1", color: "#00ffff" },
  ],
  edges: [
    { id: "e-1", sourceId: "n-root", targetId: "n-child-1" },
    { id: "e-2", sourceId: "n-root", targetId: "n-child-2" },
    { id: "e-3", sourceId: "n-child-1", targetId: "n-grandchild-1" },
  ],
};

afterEach(() => {
  cleanup();
});

describe("Mind Map Layout Utility", () => {
  it("computes coordinates layouted from a flat node structure", () => {
    const { nodes, edges } = getLayoutedElements(
      mockContent.nodes,
      mockContent.edges,
      new Set(),
      null,
      false,
      { direction: "LR" },
    );

    // Should return all nodes and edges
    expect(nodes).toHaveLength(4);
    expect(edges).toHaveLength(3);

    // Root node should be at center start (y=0 in D3 Tree layout maps to x=0 in LR)
    const rootNode = nodes.find((n) => n.id === "n-root");
    expect(rootNode).toBeDefined();
    expect(rootNode?.position.x).toBe(0);

    // Children should be shifted right
    const childNode = nodes.find((n) => n.id === "n-child-1");
    expect(childNode).toBeDefined();
    expect(childNode?.position.x).toBeGreaterThan(0);
  });

  it("filters out collapsed subtrees from the layout", () => {
    // Collapse n-child-1. Its children (n-grandchild-1) should not be layouted.
    const collapsed = new Set(["n-child-1"]);
    const { nodes, edges } = getLayoutedElements(
      mockContent.nodes,
      mockContent.edges,
      collapsed,
      null,
      false,
      { direction: "LR" },
    );

    // Root, child-1, and child-2 should exist, but grand-child-1 should be hidden
    expect(nodes).toHaveLength(3);
    expect(nodes.some((n) => n.id === "n-grandchild-1")).toBe(false);

    // Edges connecting to the hidden node should also be omitted
    expect(edges).toHaveLength(2);
    expect(edges.some((e) => e.target === "n-grandchild-1")).toBe(false);
  });

  it("applies Solo Focus Mode correctly", () => {
    // Focus on n-child-1.
    // Neighbors = n-child-1 (focused), its parent (n-root, focused), its child (n-grandchild-1, focused)
    // Non-neighbors = n-child-2 (unfocused)
    const { nodes } = getLayoutedElements(
      mockContent.nodes,
      mockContent.edges,
      new Set(),
      "n-child-1",
      true, // focusMode = true
      { direction: "LR" },
    );

    const root = nodes.find((n) => n.id === "n-root");
    const child1 = nodes.find((n) => n.id === "n-child-1");
    const child2 = nodes.find((n) => n.id === "n-child-2");
    const grand1 = nodes.find((n) => n.id === "n-grandchild-1");

    expect(root?.data.isFocused).toBe(true);
    expect(child1?.data.isFocused).toBe(true);
    expect(grand1?.data.isFocused).toBe(true);
    expect(child2?.data.isFocused).toBe(false);
  });
});

describe("MindMapView Component", () => {
  it("renders custom node content and highlights selections", () => {
    render(<MindMapView materialId="sm-mindmap-1" content={mockContent} />);

    // Renders the mock canvas React Flow container
    expect(screen.getByTestId("rf-mock")).toBeInTheDocument();

    // Verify labels render
    expect(
      within(screen.getByTestId("node-wrapper-n-root")).getByText(
        "Root Concept",
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("node-wrapper-n-child-1")).getByText(
        "Child Concept A",
      ),
    ).toBeInTheDocument();

    // Click a node to select it
    const child1Wrapper = screen.getByTestId("node-wrapper-n-child-1");
    fireEvent.click(child1Wrapper);

    // Detail card should display selected concept and connections
    expect(screen.getByText("Concept Details")).toBeInTheDocument();

    // Find the details card specifically and check its text
    const detailsCard = screen.getByText("Concept Details").closest(".border");
    expect(detailsCard).toBeInTheDocument();
    if (detailsCard) {
      expect(
        within(detailsCard as HTMLElement).getByText("Child Concept A"),
      ).toBeInTheDocument();
    }

    // Parent Link should list Root Concept
    const parentBtn = screen.getByRole("button", { name: "Root Concept" });
    expect(parentBtn).toBeInTheDocument();

    // Sub-concepts section should render grandchild
    const childBtn = screen.getByRole("button", {
      name: "Grandchild Concept A1",
    });
    expect(childBtn).toBeInTheDocument();
  });

  it("handles branch toggling interaction through layout updates", () => {
    render(<MindMapView materialId="sm-mindmap-1" content={mockContent} />);

    // Grandchild is rendered initially
    expect(screen.getByText("Grandchild Concept A1")).toBeInTheDocument();

    // The Child Concept A node has children, so it should render an Expand/Collapse button
    const child1Wrapper = screen.getByTestId("node-wrapper-n-child-1");
    const toggleButton = within(child1Wrapper).getByTitle("Collapse Branch");
    expect(toggleButton).toBeInTheDocument();

    // Click the toggle button to collapse
    fireEvent.click(toggleButton);

    // Grandchild should be removed from view since layout-utils filters it out
    expect(screen.queryByText("Grandchild Concept A1")).not.toBeInTheDocument();
  });
});
