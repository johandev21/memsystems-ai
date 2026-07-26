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
  MessageSquare,
  Users,
  PenTool,
  LayoutGrid,
  PanelRight,
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

type SlideCount = 5 | 10 | 15 | 20;
type SlideStyle = "concise" | "detailed" | "storytelling";
type AudienceLevel = "beginner" | "intermediate" | "expert";

const SLIDE_COUNT_OPTIONS: SlideCount[] = [5, 10, 15, 20];

const STYLE_OPTIONS: { id: SlideStyle; label: string }[] = [
  { id: "concise", label: "Concise" },
  { id: "detailed", label: "Detailed" },
  { id: "storytelling", label: "Storytelling" },
];

const AUDIENCE_OPTIONS: { id: AudienceLevel; label: string; description: string }[] = [
  { id: "beginner", label: "Beginner", description: "Introductory concepts" },
  { id: "intermediate", label: "Intermediate", description: "Working knowledge assumed" },
  { id: "expert", label: "Expert", description: "Advanced analysis" },
];

// ============================================================================
// Slide Deck Brief Form Component
// ============================================================================

export function SlideDeckBriefForm({
  notebookId,
  models,
  value,
  onChange,
  onSubmit,
  submitLabel = "Generate Slide Deck",
  disabled = false,
}: BaseMaterialFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [slideCount, setSlideCount] = useState<SlideCount>(
    (value.slideDeckOptions?.slideCount as SlideCount) ?? 10
  );
  const [style, setStyle] = useState<SlideStyle>(
    value.slideDeckOptions?.style ?? "concise"
  );
  const [audience, setAudience] = useState<AudienceLevel>(
    value.slideDeckOptions?.audience ?? "intermediate"
  );
  const [includeSpeakerNotes, setIncludeSpeakerNotes] = useState(
    value.slideDeckOptions?.includeSpeakerNotes ?? false
  );

  const { data: sources = [] } = useQuery(sourcesQueryOptions(notebookId));

  const hasSources = value.sourceIds.length > 0;
  const hasInstructions = value.brief.trim().length > 0;
  const canSubmit = !disabled && (hasSources || hasInstructions);

  const update = (patch: Partial<BriefFormData>) => {
    onChange({ ...value, ...patch });
  };

  useEffect(() => {
    update({ slideDeckOptions: { slideCount, style, audience, includeSpeakerNotes } });
  }, [slideCount, style, audience, includeSpeakerNotes]);

  return (
    <div className="flex gap-4 font-sans text-foreground animate-in fade-in duration-150">
      {/* LEFT — Slide Preview Panel */}
      <div className="w-[45%] shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <PanelRight className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Preview</span>
        </div>
        <div className="flex-1 border border-border rounded-2xl bg-card p-4 flex flex-col items-center justify-center gap-2 min-h-[360px]">
          <SlidePreview
            slideCount={slideCount}
            style={style}
            includeSpeakerNotes={includeSpeakerNotes}
            audience={audience}
          />
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] gap-1">
            <LayoutGrid className="size-3" />
            {slideCount} slides
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-1">
            <PenTool className="size-3" />
            {style === "concise" ? "Concise" : style === "detailed" ? "Detailed" : "Story"}
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-1">
            <Users className="size-3" />
            {audience === "beginner" ? "Beginner" : audience === "intermediate" ? "Intermed." : "Expert"}
          </Badge>
          {includeSpeakerNotes && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <MessageSquare className="size-3" />
              Notes
            </Badge>
          )}
        </div>
      </div>

      {/* RIGHT — Compact Form */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Slide count */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium text-muted-foreground">Slides</Label>
            <span className="text-[10px] font-mono font-medium text-primary">
              {slideCount} slides
            </span>
          </div>
          <div className="flex gap-1.5">
            {SLIDE_COUNT_OPTIONS.map((cnt) => {
              const selected = slideCount === cnt;
              return (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setSlideCount(cnt)}
                  className={cn(
                    "flex-1 h-9 rounded-xl text-sm font-medium border transition-all cursor-pointer",
                    selected
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                      : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {cnt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Style */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">Style</Label>
          <div className="flex gap-1.5">
            {STYLE_OPTIONS.map((opt) => {
              const selected = style === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStyle(opt.id)}
                  className={cn(
                    "flex-1 h-9 rounded-xl text-sm font-medium border transition-all cursor-pointer",
                    selected
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                      : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Audience */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">Audience</Label>
          <div className="flex gap-1.5">
            {AUDIENCE_OPTIONS.map((opt) => {
              const selected = audience === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAudience(opt.id)}
                  className={cn(
                    "flex-1 h-9 rounded-xl text-sm font-medium border transition-all cursor-pointer",
                    selected
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                      : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Speaker notes */}
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <Checkbox
            checked={includeSpeakerNotes}
            onCheckedChange={(v) => setIncludeSpeakerNotes(v === true)}
          />
          <MessageSquare className="size-3.5 text-primary" />
          Speaker notes
        </label>

        {/* Instructions */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="brief-slide-deck" className="text-xs font-medium text-muted-foreground">
            Instructions{!hasSources && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <Textarea
            id="brief-slide-deck"
            ref={textareaRef}
            value={value.brief}
            onChange={(e) => update({ brief: e.target.value })}
            placeholder="Describe the topic and key points for the slide deck..."
            className="min-h-[60px] text-xs resize-none break-words [overflow-wrap:anywhere] max-w-full overflow-x-hidden w-full"
            disabled={disabled}
          />
        </div>

        {/* Sources */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Knowledge Sources{!hasInstructions && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <SlideDeckSourcePopover
            sources={sources}
            selectedIds={value.sourceIds}
            onChange={(sourceIds) => update({ sourceIds })}
          />
        </div>

        {/* Folder + Model */}
        <div className="grid grid-cols-2 gap-3">
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
            <SlideDeckModelPopover
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
// Slide Deck Source Popover Component
// ============================================================================

function SlideDeckSourcePopover({
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

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-2xl border-border bg-card hover:bg-muted text-xs font-medium gap-2 px-3.5 justify-between w-full"
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
        {sources.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No sources in notebook. Slide deck will generate using general knowledge.
          </div>
        ) : (
          <div className="max-h-[200px] overflow-y-auto p-2 space-y-1">
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
                      : "hover:bg-muted/40 text-muted-foreground"
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
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleOne(src.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
        <div className="p-2.5 bg-muted/20 flex justify-between items-center text-xs text-muted-foreground">
          <span>{selectedIds.length} selected</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Slide Deck Model Popover Component
// ============================================================================

function SlideDeckModelPopover({
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

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-8 rounded-2xl border-border bg-card hover:bg-muted text-xs font-medium gap-2 px-3.5 justify-between w-full"
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
          {models.map((m) => {
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
                  <span className="text-xs text-muted-foreground font-normal">
                    {m.id}
                  </span>
                </div>
                {isSelected && <Check className="size-4 text-primary shrink-0" />}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Decorative Slide Preview
// ============================================================================

function SlidePreview({
  slideCount,
  style,
  includeSpeakerNotes,
  audience,
}: {
  slideCount: SlideCount;
  style: SlideStyle;
  includeSpeakerNotes: boolean;
  audience: AudienceLevel;
}) {
  const visibleSlides = Math.min(slideCount, 3);
  const sampleTitles: Record<AudienceLevel, string[]> = {
    beginner: ["Introduction", "Key Concepts", "Summary"],
    intermediate: ["Context & Setup", "Deep Dive", "Practical Takeaways"],
    expert: ["Problem Statement", "Analysis Framework", "Conclusions & Next Steps"],
  };

  const titles = sampleTitles[audience];

  const bodyLinesByStyle: Record<SlideStyle, number> = {
    concise: 2,
    detailed: 4,
    storytelling: 3,
  };

  const bodyLines = bodyLinesByStyle[style];

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-[280px]">
      {Array.from({ length: visibleSlides }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-full rounded-lg border bg-background p-3 flex flex-col gap-2 shadow-sm",
            i === 0 ? "border-primary/40" : "border-border"
          )}
        >
          <div className="w-full h-1.5 rounded-full bg-primary/40" />
          <span className="text-[10px] font-semibold text-foreground text-left">
            {titles[i] || `Slide ${i + 1}`}
          </span>
          <div className="flex flex-col gap-1">
            {Array.from({ length: bodyLines }).map((_, j) => (
              <div
                key={j}
                className="h-1 rounded-full bg-muted-foreground/20"
                style={{ width: `${85 - j * 15}%` }}
              />
            ))}
          </div>
          {includeSpeakerNotes && (
            <div className="flex items-center gap-1.5 pt-1 mt-1 border-t border-border">
              <MessageSquare className="size-3 text-muted-foreground/50" />
              <div className="h-1 flex-1 rounded-full bg-muted-foreground/15" />
            </div>
          )}
        </div>
      ))}

      {slideCount > 3 && (
        <div className="flex items-center gap-2 w-full">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] text-muted-foreground font-medium">
            +{slideCount - 3} more slides
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}
    </div>
  );
}
