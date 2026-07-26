import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  Search,
  Sparkles,
  Cpu,
  BookOpen,
  Globe,
  FileText,
  GitBranch,
  GitFork,
  Workflow,
  Palette,
  Link2,
  Hash,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Checkbox } from "@/shared/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Badge } from "@/shared/ui/badge";
import { FolderPicker } from "@/features/notebooks";
import type { ModelOption } from "@/shared/api/models";
import { sourcesQueryOptions } from "@/shared/api/sources";
import { cn } from "@/shared/lib/utils";
import type { BaseMaterialFormProps, BriefFormData } from "./types";

// ============================================================================
// Module Constants
// ============================================================================

type NodeCount = 10 | 20 | 30;
type StructureKind = "radial" | "hierarchical" | "organic";

const NODE_COUNTS: NodeCount[] = [10, 20, 30];

const STRUCTURE_OPTIONS: { value: StructureKind; label: string; icon: typeof GitBranch }[] = [
  { value: "radial", label: "Radial", icon: GitFork },
  { value: "hierarchical", label: "Hierarchical", icon: GitBranch },
  { value: "organic", label: "Organic", icon: Workflow },
];

const COLORS: string[] = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6",
  "#8b5cf6", "#ef4444", "#06b6d4", "#f97316", "#84cc16",
];

// ============================================================================
// Mind Map Brief Form Component
// ============================================================================

export function MindMapBriefForm({
  notebookId,
  models,
  value,
  onChange,
  onSubmit,
  submitLabel = "Generate Mind Map",
  disabled = false,
}: BaseMaterialFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [nodeCount, setNodeCount] = useState<NodeCount>(
    (value.mindMapOptions?.nodeCount ?? 20) as NodeCount
  );
  const [structure, setStructure] = useState<StructureKind>(
    value.mindMapOptions?.structure ?? "radial"
  );
  const [colorGroups, setColorGroups] = useState(
    value.mindMapOptions?.colorGroups ?? true
  );
  const [crossLinks, setCrossLinks] = useState(
    value.mindMapOptions?.crossLinks ?? false
  );

  const { data: sources = [] } = useQuery(sourcesQueryOptions(notebookId));

  const hasSources = value.sourceIds.length > 0;
  const hasInstructions = value.brief.trim().length > 0;
  const canSubmit = !disabled && (hasSources || hasInstructions);

  const update = (patch: Partial<BriefFormData>) => {
    onChange({ ...value, ...patch });
  };

  useEffect(() => {
    update({
      mindMapOptions: { nodeCount, structure, colorGroups, crossLinks },
    });
  }, [nodeCount, structure, colorGroups, crossLinks]);

  return (
    <div className="flex gap-4 font-sans text-foreground">
      {/* LEFT — Live Preview Panel */}
      <div className="w-[48%] shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <GitFork className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Live Preview</span>
        </div>
        <div className="flex-1 border border-border rounded-2xl bg-card p-3 flex items-center justify-center min-h-[380px] overflow-hidden">
          <MindMapDoodle
            structure={structure}
            nodeCount={nodeCount}
            colorGroups={colorGroups}
            crossLinks={crossLinks}
          />
        </div>
        <div className="flex items-center gap-2 justify-center flex-wrap">
          <Badge variant="outline" className="text-[10px] gap-1">
            <GitBranch className="size-3" />
            {structure.charAt(0).toUpperCase() + structure.slice(1)}
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-1">
            <Hash className="size-3" />
            {nodeCount} nodes
          </Badge>
          {colorGroups && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Palette className="size-3" />
              Colors
            </Badge>
          )}
          {crossLinks && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Link2 className="size-3" />
              Cross-links
            </Badge>
          )}
        </div>
      </div>

      {/* RIGHT — Compact Form */}
      <div className="flex-1 flex flex-col gap-3">
        {/* Structure */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">Structure</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {STRUCTURE_OPTIONS.map((opt) => {
              const selected = structure === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStructure(opt.value)}
                  className={cn(
                    "h-8 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center justify-center gap-1.5",
                    selected
                      ? "bg-primary text-primary-foreground border-primary font-semibold"
                      : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="size-3" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Node Count */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">Node Count</Label>
          <div className="flex gap-1.5">
            {NODE_COUNTS.map((cnt) => {
              const selected = nodeCount === cnt;
              return (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setNodeCount(cnt)}
                  className={cn(
                    "flex-1 h-8 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                    selected
                      ? "bg-primary text-primary-foreground border-primary font-semibold"
                      : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {cnt} Nodes
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggle Cards: Color Groups + Cross Links */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">Options</Label>
          <label className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-border bg-card cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 flex-1">
              <Palette className="size-4 text-primary shrink-0" />
              <div>
                <span className="text-xs font-medium text-foreground">Color Groups</span>
                <p className="text-[10px] text-muted-foreground">Group related nodes by color</p>
              </div>
            </div>
            <Checkbox checked={colorGroups} onCheckedChange={(v) => setColorGroups(v === true)} />
          </label>
          <label className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-border bg-card cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 flex-1">
              <Link2 className="size-4 text-primary shrink-0" />
              <div>
                <span className="text-xs font-medium text-foreground">Cross Links</span>
                <p className="text-[10px] text-muted-foreground">Show connections between sibling concepts</p>
              </div>
            </div>
            <Checkbox checked={crossLinks} onCheckedChange={(v) => setCrossLinks(v === true)} />
          </label>
        </div>

        {/* Instructions */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="brief-mindmap" className="text-xs font-medium text-muted-foreground">
            Instructions{!hasSources && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <Textarea
            id="brief-mindmap"
            ref={textareaRef}
            value={value.brief}
            onChange={(e) => update({ brief: e.target.value })}
            placeholder="Describe the topic or concepts you want to map..."
            className="min-h-[60px] text-xs resize-none break-words [overflow-wrap:anywhere] max-w-full overflow-x-hidden w-full"
            disabled={disabled}
          />
        </div>

        {/* Sources */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Sources{!hasInstructions && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <MindMapSourcePopover
            sources={sources}
            selectedIds={value.sourceIds}
            onChange={(sourceIds) => update({ sourceIds })}
          />
        </div>

        {/* Folder + Model */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Folder</Label>
            <FolderPicker
              notebookId={notebookId}
              value={value.folderId}
              onChange={(folderId) => update({ folderId })}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Model</Label>
            <MindMapModelPopover
              models={models}
              selectedModel={value.model}
              onModelChange={(model) => update({ model })}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Submit */}
        <Button
          type="button"
          className="w-full h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-md gap-2 cursor-pointer hover:opacity-95 transition-all mt-1"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          <Sparkles className="size-4" />
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Decorative Mind Map Doodle
// ============================================================================

function MindMapDoodle({
  structure,
  nodeCount,
  colorGroups,
  crossLinks,
}: {
  structure: StructureKind;
  nodeCount: NodeCount;
  colorGroups: boolean;
  crossLinks: boolean;
}) {
  const w = 360;
  const h = 380;
  const cx = w / 2;
  const cy = h / 2;

  const tiers = structure === "hierarchical"
    ? [
        { count: 1, y: cy - h * 0.25 },
        { count: 3, y: cy - h * 0.05 },
        { count: 5, y: cy + h * 0.15 },
        { count: 5, y: cy + h * 0.35 },
      ]
    : [
        { radius: 0 },
        { radius: (w / 2) * 0.25 },
        { radius: (w / 2) * 0.5 },
        { radius: (w / 2) * 0.72 },
      ];

  const totalToPlace = Math.min(nodeCount, 20);
  const nodes: Array<{ x: number; y: number; r: number; color: string; tier: number }> = [];

  nodes.push({
    x: cx,
    y: structure === "hierarchical" ? cy - h * 0.35 : cy,
    r: 6,
    color: COLORS[0],
    tier: 0,
  });

  let placed = 1;
  for (let t = 1; t < 4 && placed < totalToPlace; t++) {
    const countInTier = Math.min(t === 1 ? 4 : 6, totalToPlace - placed);

    for (let i = 0; i < countInTier; i++) {
      let x: number;
      let y: number;

      if (structure === "hierarchical") {
        const tierData = tiers[t] as { count: number; y: number };
        const step = w / (tierData.count + 1);
        x = step * (i + 1) + (Math.random() - 0.5) * 12;
        y = tierData.y + (Math.random() - 0.5) * 8;
      } else if (structure === "radial") {
        const tierData = tiers[t] as { radius: number };
        const angle = (2 * Math.PI * i) / countInTier + (Math.random() - 0.5) * 0.3;
        x = cx + Math.cos(angle) * tierData.radius;
        y = cy + Math.sin(angle) * tierData.radius;
      } else {
        const tierData = tiers[t] as { radius: number };
        const angle = (2 * Math.PI * i) / countInTier + (Math.random() - 0.5) * 0.8;
        const radiusJitter = tierData.radius * (0.75 + Math.random() * 0.5);
        x = cx + Math.cos(angle) * radiusJitter;
        y = cy + Math.sin(angle) * radiusJitter;
      }

      nodes.push({
        x,
        y,
        r: t === 1 ? 5 : 4,
        color: colorGroups ? COLORS[t] ?? COLORS[0] : COLORS[0],
        tier: t,
      });
      placed++;
    }
  }

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-full"
      style={{ maxWidth: w, maxHeight: h }}
    >
      {nodes.filter((n) => n.tier === 1).map((n, i) => {
        const root = nodes[0];
        return (
          <line
            key={`e0-${i}`}
            x1={root.x}
            y1={root.y}
            x2={n.x}
            y2={n.y}
            stroke={colorGroups ? n.color : "var(--color-border)"}
            strokeWidth={1.2}
            opacity={0.5}
          />
        );
      })}

      {crossLinks &&
        nodes
          .filter((n) => n.tier === 1)
          .slice(0, -1)
          .map((n, i, arr) => {
            const next = arr[(i + 1) % arr.length];
            return (
              <line
                key={`x-${i}`}
                x1={n.x}
                y1={n.y}
                x2={next.x}
                y2={next.y}
                stroke="var(--color-primary)"
                strokeWidth={0.4}
                strokeDasharray="2 2"
                opacity={0.3}
              />
            );
          })}

      {nodes.map((n, i) => (
        <g key={`n${i}`}>
          <circle
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={n.color}
            opacity={i === 0 ? 1 : 0.6}
          />
          {i === 0 && (
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r + 2}
              fill="none"
              stroke={n.color}
              strokeWidth={1}
              opacity={0.3}
            />
          )}
        </g>
      ))}

      <text
        x={cx}
        y={structure === "hierarchical" ? cy - h * 0.35 - 12 : cy + 14}
        textAnchor="middle"
        fill="var(--color-foreground)"
        fontSize={10}
        fontWeight={600}
      >
        Root
      </text>
    </svg>
  );
}

// ============================================================================
// Mind Map Source Popover Component
// ============================================================================

function MindMapSourcePopover({
  sources,
  selectedIds,
  onChange,
}: {
  sources: Array<{ id: string; title: string; kind: string }>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = sources.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected =
    filtered.length > 0 && filtered.every((s) => selectedIds.includes(s.id));

  const toggleAll = () => {
    if (allSelected) {
      const filteredSet = new Set(filtered.map((s) => s.id));
      onChange(selectedIds.filter((id) => !filteredSet.has(id)));
    } else {
      const merged = new Set([...selectedIds, ...filtered.map((s) => s.id)]);
      onChange(Array.from(merged));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  function renderHeader() {
    return (
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/30">
        <div className="flex items-center gap-2 flex-1">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search sources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-2 pl-2">
          <span
            className="text-xs text-muted-foreground cursor-pointer select-none"
            onClick={toggleAll}
          >
            Select all
          </span>
          <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
        </div>
      </div>
    );
  }

  function renderSourceList() {
    if (sources.length === 0) {
      return (
        <div className="p-4 text-center text-xs text-muted-foreground">
          No sources in notebook. Mind map will generate using general knowledge.
        </div>
      );
    }

    return (
      <div className="max-h-[220px] overflow-y-auto p-2 space-y-1">
        {filtered.map((src) => {
          const checked = selectedIds.includes(src.id);
          return (
            <div
              key={src.id}
              onClick={() => toggleOne(src.id)}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors",
                checked ? "bg-muted/70 text-foreground font-medium" : "hover:bg-muted/40 text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2 truncate pr-2">
                {src.kind === "web" ? (
                  <Globe className="size-4 text-primary shrink-0" />
                ) : src.kind === "file" ? (
                  <FileText className="size-4 text-primary shrink-0" />
                ) : (
                  <BookOpen className="size-4 text-primary shrink-0" />
                )}
                <span className="truncate">{src.title}</span>
              </div>
              <Checkbox checked={checked} onCheckedChange={() => toggleOne(src.id)} />
            </div>
          );
        })}
      </div>
    );
  }

  function renderFooter() {
    return (
      <div className="p-2.5 bg-muted/20 flex justify-between items-center text-xs text-muted-foreground">
        <span>{selectedIds.length} selected</span>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-2xl border-border bg-card hover:bg-muted text-xs font-medium gap-2 px-3.5 justify-between w-full"
          >
            <div className="flex items-center gap-2 truncate">
              <BookOpen className="size-4 text-primary shrink-0" />
              <span className="truncate">
                {selectedIds.length === 0
                  ? "None selected (General Knowledge)"
                  : `${selectedIds.length} source${selectedIds.length !== 1 ? "s" : ""} selected`}
              </span>
            </div>
            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-[320px] p-0 bg-popover border-border shadow-xl rounded-2xl overflow-hidden">
        {renderHeader()}
        {renderSourceList()}
        {renderFooter()}
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Mind Map Model Popover Component
// ============================================================================

export function MindMapModelPopover({
  models,
  selectedModel,
  onModelChange,
  disabled,
}: {
  models: ModelOption[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}) {
  const selected = models.find((m) => m.id === selectedModel) ?? models[0];

  function renderModelRow(m: ModelOption) {
    const isSelected = m.id === selectedModel;
    return (
      <div
        key={m.id}
        onClick={() => onModelChange(m.id)}
        className={cn(
          "flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-colors",
          isSelected
            ? "bg-muted text-foreground font-semibold"
            : "hover:bg-muted/50 text-muted-foreground"
        )}
      >
        <div className="flex flex-col min-w-0">
          <span className="truncate">{m.displayName}</span>
          <span className="text-xs text-muted-foreground font-normal">{m.id}</span>
        </div>
        {isSelected && <Check className="size-4 text-primary shrink-0" />}
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-9 rounded-2xl border-border bg-card hover:bg-muted text-xs font-medium gap-2 px-3.5 justify-between w-full"
          >
            <div className="flex items-center gap-2 truncate">
              <Cpu className="size-4 text-primary shrink-0" />
              <span className="truncate">{selected?.displayName || selectedModel || "Select Model"}</span>
            </div>
            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          </Button>
        }
      />
      <PopoverContent align="end" className="w-[280px] p-2 bg-popover border-border shadow-xl rounded-2xl">
        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
          Select Model
        </div>
        <div className="space-y-1 mt-1">
          {models.map(renderModelRow)}
        </div>
      </PopoverContent>
    </Popover>
  );
}
