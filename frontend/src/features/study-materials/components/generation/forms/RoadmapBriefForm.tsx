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
  Clock,
  Link2,
  Layers,
  Map,
  Compass,
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

type PhaseCount = 3 | 5 | 7;
type DetailLevel = "basic" | "detailed";

const PHASE_OPTIONS: { value: PhaseCount; label: string }[] = [
  { value: 3, label: "3" },
  { value: 5, label: "5" },
  { value: 7, label: "7" },
];

const DETAIL_OPTIONS = [
  { id: "basic" as DetailLevel, title: "Basic", desc: "Phase titles & milestones only", icon: Compass },
  { id: "detailed" as DetailLevel, title: "Detailed", desc: "In-depth topics, descriptions & learning objectives", icon: Layers },
] as const;

// ============================================================================
// Roadmap Brief Form Component
// ============================================================================

export function RoadmapBriefForm({
  notebookId,
  models,
  value,
  onChange,
  onSubmit,
  submitLabel = "Generate Roadmap",
  disabled = false,
}: BaseMaterialFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [phaseCount, setPhaseCount] = useState<PhaseCount>(
    (value.roadmapOptions?.phaseCount as PhaseCount) ?? 5,
  );
  const [detailLevel, setDetailLevel] = useState<DetailLevel>(
    value.roadmapOptions?.detailLevel ?? "detailed",
  );
  const [includeTimeEstimates, setIncludeTimeEstimates] = useState(
    value.roadmapOptions?.includeTimeEstimates ?? true,
  );
  const [includeResources, setIncludeResources] = useState(
    value.roadmapOptions?.includeResources ?? false,
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
      roadmapOptions: {
        phaseCount,
        detailLevel,
        includeTimeEstimates,
        includeResources,
      },
    });
  }, [phaseCount, detailLevel, includeTimeEstimates, includeResources]);

  return (
    <div className="flex gap-4 font-sans text-foreground animate-in fade-in duration-150">
      {/* LEFT — Visual Preview Panel */}
      <div className="w-[45%] shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Map className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Preview</span>
        </div>
        <div className="flex-1 border border-border rounded-2xl bg-card p-5 flex flex-col items-center justify-center gap-1 min-h-[240px]">
          <RoadmapPreview phaseCount={phaseCount} detailLevel={detailLevel} />
        </div>
        {(includeTimeEstimates || includeResources) && (
          <div className="flex items-center gap-3 justify-center py-1">
            {includeTimeEstimates && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Clock className="size-3" />
                Time
              </Badge>
            )}
            {includeResources && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Link2 className="size-3" />
                Resources
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* RIGHT — Form Controls */}
      <div className="flex-1 flex flex-col gap-3">
        {/* Phase count — segmented buttons */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-foreground">Phases</Label>
          <div className="flex gap-2">
            {PHASE_OPTIONS.map((opt) => {
              const selected = phaseCount === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPhaseCount(opt.value)}
                  className={cn(
                    "flex-1 h-9 rounded-xl text-sm font-medium border transition-all cursor-pointer flex items-center justify-center gap-1.5",
                    selected
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                      : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  {selected && <Check className="size-3.5 text-primary-foreground shrink-0" />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail level — icon cards */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-foreground">Detail Level</Label>
          <div className="grid grid-cols-2 gap-2">
            {DETAIL_OPTIONS.map((opt) => {
              const selected = detailLevel === opt.id;
              const Icon = opt.icon;
              return (
                <div
                  key={opt.id}
                  onClick={() => setDetailLevel(opt.id)}
                  className={cn(
                    "p-3 rounded-2xl border bg-card cursor-pointer transition-all flex items-start gap-3",
                    selected
                      ? "border-primary bg-muted/40 ring-1 ring-primary/30"
                      : "border-border hover:bg-muted/30",
                  )}
                >
                  <div
                    className={cn(
                      "size-9 rounded-xl flex items-center justify-center shrink-0",
                      selected ? "bg-primary/10" : "bg-muted",
                    )}
                  >
                    <Icon className={cn("size-4", selected ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground">{opt.title}</span>
                      {selected && <Check className="size-3.5 text-primary shrink-0" />}
                    </div>
                    <span className="text-xs text-muted-foreground leading-tight">{opt.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Toggles — time estimates & resources */}
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-border bg-card cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2.5 flex-1">
              <Clock className="size-4 text-primary shrink-0" />
              <div>
                <span className="text-xs font-medium text-foreground">Time estimates</span>
                <p className="text-[10px] text-muted-foreground">Estimated minutes per topic</p>
              </div>
            </div>
            <Checkbox
              checked={includeTimeEstimates}
              onCheckedChange={(v) => setIncludeTimeEstimates(v === true)}
            />
          </label>
          <label className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-border bg-card cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2.5 flex-1">
              <Link2 className="size-4 text-primary shrink-0" />
              <div>
                <span className="text-xs font-medium text-foreground">Resources</span>
                <p className="text-[10px] text-muted-foreground">Readings, videos & exercises</p>
              </div>
            </div>
            <Checkbox
              checked={includeResources}
              onCheckedChange={(v) => setIncludeResources(v === true)}
            />
          </label>
        </div>

        {/* Sources */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-foreground">
            Sources{!hasInstructions && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <RoadmapSourcePopover
            sources={sources}
            selectedIds={value.sourceIds}
            onChange={(sourceIds) => update({ sourceIds })}
            compact
          />
        </div>

        {/* Instructions */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="brief-roadmap" className="text-sm font-medium text-foreground">
            Instructions{!hasSources && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <Textarea
            id="brief-roadmap"
            ref={textareaRef}
            value={value.brief}
            onChange={(e) => update({ brief: e.target.value })}
            placeholder="What do you want to learn? Describe the topic or skill..."
            className="min-h-[56px] text-xs resize-none break-words [overflow-wrap:anywhere] max-w-full overflow-x-hidden w-full"
            disabled={disabled}
          />
        </div>

        {/* Folder + Model */}
        <div className="grid grid-cols-2 gap-4 items-center">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Destination Folder</Label>
            <FolderPicker
              notebookId={notebookId}
              value={value.folderId}
              onChange={(folderId) => update({ folderId })}
              disabled={disabled}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">AI Intelligence Model</Label>
            <RoadmapModelPopover
              models={models}
              selectedModel={value.model}
              onModelChange={(model) => update({ model })}
              disabled={disabled}
              compact
            />
          </div>
        </div>

        {/* Submit */}
        <Button
          type="button"
          className="w-full h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-md gap-2 cursor-pointer hover:opacity-95 transition-all"
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
// Roadmap Source Popover Component
// ============================================================================

function RoadmapSourcePopover({
  sources,
  selectedIds,
  onChange,
  compact = false,
}: {
  sources: Array<{ id: string; title: string; kind: string }>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  compact?: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = sources.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()),
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
          No sources in notebook. Roadmap will generate using general knowledge.
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
                checked
                  ? "bg-muted/70 text-foreground font-medium"
                  : "hover:bg-muted/40 text-muted-foreground",
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
            className={cn(
              "rounded-2xl border-border bg-card hover:bg-muted text-xs font-medium gap-2 px-3.5 justify-between w-full",
              compact ? "h-8" : "h-9",
            )}
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
      <PopoverContent
        align="start"
        className="w-[320px] p-0 bg-popover border-border shadow-xl rounded-2xl overflow-hidden"
      >
        {renderHeader()}
        {renderSourceList()}
        {renderFooter()}
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Roadmap Model Popover Component
// ============================================================================

function RoadmapModelPopover({
  models,
  selectedModel,
  onModelChange,
  disabled,
  compact = false,
}: {
  models: ModelOption[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
  compact?: boolean;
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
            : "hover:bg-muted/50 text-muted-foreground",
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
            className={cn(
              "rounded-2xl border-border bg-card hover:bg-muted text-xs font-medium gap-2 px-3.5 justify-between w-full",
              compact ? "h-8" : "h-9",
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <Cpu className="size-4 text-primary shrink-0" />
              <span className="truncate">
                {selected?.displayName || selectedModel || "Select Model"}
              </span>
            </div>
            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          </Button>
        }
      />
      <PopoverContent
        align="end"
        className="w-[280px] p-2 bg-popover border-border shadow-xl rounded-2xl"
      >
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

// ============================================================================
// Decorative Roadmap Preview
// ============================================================================

function RoadmapPreview({
  phaseCount,
  detailLevel,
}: {
  phaseCount: PhaseCount;
  detailLevel: DetailLevel;
}) {
  const phaseLabels: Record<PhaseCount, string[]> = {
    3: ["Foundations", "Application", "Mastery"],
    5: ["Intro", "Core", "Deepening", "Advanced", "Mastery"],
    7: ["Intro", "Core I", "Core II", "Applied", "Advanced I", "Advanced II", "Mastery"],
  };

  const labels = phaseLabels[phaseCount];

  return (
    <div className="flex flex-col items-center w-full gap-0">
      {labels.map((label, i) => (
        <div key={i} className="flex flex-col items-center w-full">
          <div
            className={cn(
              "rounded-2xl border-2 transition-all flex flex-col items-center justify-center",
              detailLevel === "detailed" ? "w-full px-3 py-2" : "w-3/4 px-3 py-1.5",
              i === 0
                ? "border-primary/60 bg-primary/10"
                : i === labels.length - 1
                  ? "border-primary bg-primary/20"
                  : "border-border bg-muted/30",
            )}
          >
            <span
              className={cn(
                "font-semibold text-foreground",
                detailLevel === "detailed" ? "text-[11px]" : "text-[10px]",
              )}
            >
              Phase {i + 1}: {label}
            </span>
            {detailLevel === "detailed" && (
              <div className="flex gap-1 mt-1.5 w-full">
                <div className="h-1.5 flex-1 rounded-full bg-muted-foreground/20" />
                <div className="h-1.5 flex-1 rounded-full bg-muted-foreground/20" />
                <div className="h-1.5 w-1/3 rounded-full bg-muted-foreground/20" />
              </div>
            )}
          </div>
          {i < labels.length - 1 && (
            <div className="flex flex-col items-center py-0.5">
              <div className="w-0.5 h-3 bg-border" />
              <div className="size-1.5 rounded-full bg-primary/40" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
