import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  Search,
  Cpu,
  BookOpen,
  Globe,
  FileText,
  ArrowRight,
  ArrowLeft,
  FileTextIcon,
  GraduationCap,
  Briefcase,
  Newspaper,
  Sparkles,
  Settings2,
  ChevronUp,
  Plus,
  GripVertical,
  Trash2,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Input } from "@/shared/ui/input";
import { Checkbox } from "@/shared/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Badge } from "@/shared/ui/badge";
import { FolderPicker } from "@/features/notebooks";
import type { ModelOption } from "@/shared/api/models";
import { sourcesQueryOptions } from "@/shared/api/sources";
import { cn } from "@/shared/lib/utils";
import type { BaseMaterialFormProps, BriefFormData, ReportOptions } from "./types";

// ============================================================================
// Module Constants
// ============================================================================

const REPORT_TYPES = [
  { id: "summary", title: "Summary", description: "Key points and overview", icon: Newspaper },
  { id: "detailed", title: "Detailed", description: "Comprehensive analysis", icon: FileTextIcon },
  { id: "academic", title: "Academic", description: "Structured with citations", icon: GraduationCap },
  { id: "executive", title: "Executive", description: "Concise for decision makers", icon: Briefcase },
] as const;

type ReportTypeId = (typeof REPORT_TYPES)[number]["id"];

const TONES = [
  { id: "formal", title: "Formal" },
  { id: "conversational", title: "Conversational" },
  { id: "technical", title: "Technical" },
  { id: "journalistic", title: "Journalistic" },
] as const;

type ToneId = (typeof TONES)[number]["id"];

const LENGTHS = [
  { id: "short", title: "Short", sections: 3 },
  { id: "medium", title: "Medium", sections: 5 },
  { id: "long", title: "Long", sections: 8 },
  { id: "comprehensive", title: "Comprehensive", sections: 12 },
] as const;

type LengthId = (typeof LENGTHS)[number]["id"];

const TEMPLATE_SECTIONS: Record<ReportTypeId, string[]> = {
  summary: ["Overview", "Key Points", "Takeaways"],
  detailed: ["Introduction", "Key Findings", "Analysis", "Conclusion", "Recommendations"],
  academic: ["Abstract", "Introduction", "Literature Review", "Methodology", "Findings", "Discussion", "Conclusion", "References"],
  executive: ["Executive Summary", "Problem Statement", "Analysis", "Recommendations", "Next Steps"],
};

const DEFAULT_REPORT_OPTIONS: ReportOptions = {
  type: "detailed",
  tone: "formal",
  length: "medium",
  sectionCount: 5,
  includeSummary: true,
  includeCitations: false,
  sections: TEMPLATE_SECTIONS.detailed,
};

// ============================================================================
// Shared Helper Components
// ============================================================================

function useReportValidation(value: BriefFormData) {
  const hasSources = value.sourceIds.length > 0;
  const hasInstructions = value.brief.trim().length > 0;
  const hasRequiredInput = hasSources || hasInstructions;
  return { hasSources, hasInstructions, hasRequiredInput };
}

function RequiredHint({ active }: { active: boolean }) {
  if (!active) return null;
  return <span className="text-destructive ml-0.5">*</span>;
}

function ReportSourcePopover({
  sources,
  selectedIds,
  onChange,
  required,
}: {
  sources: Array<{ id: string; title: string; kind: string }>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  required?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = sources.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));
  const allSelected = filtered.length > 0 && filtered.every((s) => selectedIds.includes(s.id));

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-10 rounded-2xl border-border bg-card hover:bg-muted text-xs font-medium gap-2 px-3.5 justify-between w-full",
              required && selectedIds.length === 0 && "border-destructive"
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <BookOpen className="size-4 text-primary shrink-0" />
              <span className="truncate">
                {selectedIds.length === 0
                  ? "Select sources..."
                  : `${selectedIds.length} source${selectedIds.length !== 1 ? "s" : ""} selected`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {required && selectedIds.length === 0 && <span className="text-destructive text-xs">*</span>}
              <ChevronDown className="size-4 text-muted-foreground shrink-0" />
            </div>
          </Button>
        }
      />
      <PopoverContent align="start" className="w-[340px] p-0 bg-popover border-border shadow-xl rounded-2xl overflow-hidden">
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
            <span className="text-xs text-muted-foreground cursor-pointer select-none" onClick={toggleAll}>
              Select all
            </span>
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
          </div>
        </div>

        {sources.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No sources in notebook. Reports can use general knowledge.
          </div>
        ) : (
          <div className="max-h-[240px] overflow-y-auto p-2 space-y-1">
            {filtered.map((src) => {
              const checked = selectedIds.includes(src.id);
              return (
                <div
                  key={src.id}
                  onClick={() => toggleOne(src.id)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-colors",
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
        )}

        <div className="p-2.5 bg-muted/20 flex justify-between items-center text-xs text-muted-foreground">
          <span>{selectedIds.length} selected</span>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ReportModelPopover({
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
            className="h-10 rounded-2xl border-border bg-card hover:bg-muted text-xs font-medium gap-2 px-3.5 justify-between w-full"
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
        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Select Model</div>
        <div className="space-y-1 mt-1">
          {models.map((m) => {
            const isSelected = m.id === selectedModel;
            return (
              <div
                key={m.id}
                onClick={() => onModelChange(m.id)}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-colors",
                  isSelected ? "bg-muted text-foreground font-semibold" : "hover:bg-muted/50 text-muted-foreground"
                )}
              >
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{m.displayName}</span>
                  <span className="text-xs text-muted-foreground font-normal">{m.id}</span>
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

function StructureEditor({
  sections,
  onChange,
}: {
  sections: string[];
  onChange: (sections: string[]) => void;
}) {
  const [newSection, setNewSection] = useState("");
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const addSection = () => {
    if (newSection.trim() && !sections.includes(newSection.trim())) {
      onChange([...sections, newSection.trim()]);
      setNewSection("");
    }
  };

  const removeSection = (idx: number) => {
    onChange(sections.filter((_, i) => i !== idx));
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    if (dir === -1 && idx === 0) return;
    if (dir === 1 && idx === sections.length - 1) return;
    const next = [...sections];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    onChange(next);
  };

  const handleDragStart = (idx: number) => {
    setDraggingIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === idx) return;
    const next = [...sections];
    const [moved] = next.splice(draggingIdx, 1);
    next.splice(idx, 0, moved);
    setDraggingIdx(idx);
    onChange(next);
  };

  const handleDragEnd = () => {
    setDraggingIdx(null);
  };

  return (
    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{sections.length} sections</span>
        <span className="text-[10px] text-muted-foreground">Drag to reorder</span>
      </div>
      <div className="border border-border rounded-2xl bg-card p-2 space-y-1">
        {sections.map((section, idx) => (
          <div
            key={`${section}-${idx}`}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs text-foreground group transition-all cursor-grab active:cursor-grabbing",
              draggingIdx === idx ? "bg-primary/10 opacity-60" : "bg-muted/30 hover:bg-muted/50"
            )}
          >
            <GripVertical className="size-3.5 text-muted-foreground" />
            <span className="flex-1 select-none">{section}</span>
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 h-6 w-6 rounded-lg"
                onClick={() => moveSection(idx, -1)}
                disabled={idx === 0}
              >
                <ArrowLeft className="size-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 h-6 w-6 rounded-lg"
                onClick={() => moveSection(idx, 1)}
                disabled={idx === sections.length - 1}
              >
                <ArrowRight className="size-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 h-6 w-6 rounded-lg hover:text-destructive"
                onClick={() => removeSection(idx)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1">
          <Input
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            placeholder="Add section..."
            className="h-8 text-xs rounded-xl"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSection();
              }
            }}
          />
          <Button type="button" variant="outline" size="icon" className="size-8 rounded-xl shrink-0" onClick={addSection}>
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CustomizeStructureButton({
  expanded,
  onClick,
}: {
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
    >
      <Settings2 className="size-3.5" />
      {expanded ? "Hide structure editor" : "Customize structure"}
      {expanded ? <ChevronUp className="size-3" /> : <ArrowRight className="size-3 rotate-90" />}
    </Button>
  );
}

// ============================================================================
// Report Brief Form Component
// ============================================================================

export function ReportBriefForm({
  notebookId,
  models,
  value,
  onChange,
  onSubmit,
  submitLabel = "Generate Report",
  disabled = false,
}: BaseMaterialFormProps) {
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize from value.reportOptions or defaults
  const initialOptions = value.reportOptions ?? DEFAULT_REPORT_OPTIONS;

  // State
  const [step, setStep] = useState<1 | 2>(1);
  const [reportType, setReportType] = useState<ReportTypeId>(initialOptions.type);
  const [tone, setTone] = useState<ToneId>(initialOptions.tone);
  const [length, setLength] = useState<LengthId | "custom">(initialOptions.length);
  const [isCustomLength, setIsCustomLength] = useState(initialOptions.length === "custom");
  const [customSectionCount, setCustomSectionCount] = useState(initialOptions.sectionCount);
  const [sections, setSections] = useState<string[]>(initialOptions.sections ?? TEMPLATE_SECTIONS.detailed);
  const [isStructureCustomized, setIsStructureCustomized] = useState(
    initialOptions.length === "custom" ||
      (initialOptions.sections !== undefined &&
        JSON.stringify(initialOptions.sections) !==
          JSON.stringify(TEMPLATE_SECTIONS[initialOptions.type].slice(0, initialOptions.sectionCount)))
  );
  const [showStructureEditor, setShowStructureEditor] = useState(false);
  const [includeSummary, setIncludeSummary] = useState(initialOptions.includeSummary);
  const [includeCitations, setIncludeCitations] = useState(initialOptions.includeCitations);

  // Queries
  const { data: sources = [] } = useQuery(sourcesQueryOptions(notebookId));
  const { hasSources, hasInstructions } = useReportValidation(value);
  const canSubmit = !disabled && (hasSources || hasInstructions);

  // Derived: section count is always derived from the source of truth
  const effectiveSectionCount = isStructureCustomized
    ? sections.length
    : isCustomLength
      ? customSectionCount
      : LENGTHS.find((l) => l.id === length)?.sections ?? DEFAULT_REPORT_OPTIONS.sectionCount;

  // Handlers
  const update = (patch: Partial<BriefFormData>) => {
    onChange({ ...value, ...patch });
  };

  const syncReportOptions = (opts: Partial<ReportOptions>) => {
    const current = value.reportOptions ?? DEFAULT_REPORT_OPTIONS;
    update({
      reportOptions: {
        ...current,
        ...opts,
      },
    });
  };

  // Build sections list for a given report type and section count
  const buildSections = (type: ReportTypeId, count: number) => {
    const base = TEMPLATE_SECTIONS[type];
    if (count >= base.length) {
      // Pad with generic sections
      const padded = [...base];
      let counter = 1;
      while (padded.length < count) {
        padded.push(`Section ${base.length + counter}`);
        counter += 1;
      }
      return padded;
    }
    return base.slice(0, count);
  };

  // Sync form state to parent value
  useEffect(() => {
    syncReportOptions({
      type: reportType,
      tone,
      length: isStructureCustomized || isCustomLength ? "custom" : length,
      sectionCount: effectiveSectionCount,
      includeSummary,
      includeCitations,
      sections: isStructureCustomized || isCustomLength ? sections : undefined,
    });
  }, [
    reportType,
    tone,
    length,
    isCustomLength,
    isStructureCustomized,
    effectiveSectionCount,
    includeSummary,
    includeCitations,
    sections,
  ]);

  const handleReportTypeSelect = (type: ReportTypeId) => {
    setReportType(type);
    if (!isStructureCustomized) {
      setSections(buildSections(type, effectiveSectionCount));
    }
  };

  const handleLengthSelect = (len: LengthId) => {
    setLength(len);
    setIsCustomLength(false);
    setIsStructureCustomized(false);
    setSections(buildSections(reportType, LENGTHS.find((l) => l.id === len)?.sections ?? DEFAULT_REPORT_OPTIONS.sectionCount));
  };

  const handleCustomSectionChange = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.min(50, Math.max(1, parsed));
      setCustomSectionCount(clamped);
      setIsCustomLength(true);
      setIsStructureCustomized(false);
      setSections(buildSections(reportType, clamped));
    }
  };

  const handleStructureChange = (newSections: string[]) => {
    setSections(newSections);
    setIsStructureCustomized(true);
    setIsCustomLength(false);
    setLength("custom");
  };

  const handleToggleStructureEditor = () => {
    const next = !showStructureEditor;
    setShowStructureEditor(next);
    if (next && !isStructureCustomized) {
      // Initialize editor with current sections when opening for the first time
      setSections(buildSections(reportType, effectiveSectionCount));
    }
  };

  function renderStepOne() {
    return (
      <div className="flex flex-col gap-6 min-h-[420px] animate-in fade-in slide-in-from-right-2 duration-150">
        {/* Report Type */}
        <div className="flex flex-col gap-3">
          <Label className="text-sm font-semibold text-foreground">Report Type</Label>
          <div className="grid grid-cols-2 gap-3">
            {REPORT_TYPES.map((type) => {
              const Icon = type.icon;
              const selected = reportType === type.id;
              return (
                <div
                  key={type.id}
                  onClick={() => handleReportTypeSelect(type.id)}
                  className={cn(
                    "p-3 rounded-2xl border bg-card cursor-pointer transition-all flex items-start gap-3",
                    selected ? "border-primary bg-muted/40 ring-1 ring-primary/30" : "border-border hover:bg-muted/30"
                  )}
                >
                  <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", selected ? "bg-primary/10" : "bg-muted")}>
                    <Icon className={cn("size-4", selected ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground">{type.title}</span>
                      {selected && <Check className="size-3.5 text-primary shrink-0" />}
                    </div>
                    <span className="text-xs text-muted-foreground leading-tight">{type.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tone */}
        <div className="flex flex-col gap-3">
          <Label className="text-sm font-semibold text-foreground">Tone</Label>
          <div className="flex gap-2">
            {TONES.map((t) => {
              const selected = tone === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={cn(
                    "flex-1 h-9 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                    selected ? "bg-primary text-primary-foreground border-primary font-semibold" : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {t.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Length Presets + Custom */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground">Length</Label>
            <span className="text-xs font-mono font-medium text-primary">
              {effectiveSectionCount} {effectiveSectionCount === 1 ? "section" : "sections"}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {LENGTHS.map((len) => {
              const selected = length === len.id && !isCustomLength && !isStructureCustomized;
              return (
                <button
                  key={len.id}
                  type="button"
                  onClick={() => handleLengthSelect(len.id)}
                  className={cn(
                    "h-10 rounded-xl text-xs font-medium border transition-all cursor-pointer flex flex-col items-center justify-center",
                    selected
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                      : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <span>{len.title}</span>
                  <span className="text-[10px] opacity-80">{len.sections} sections</span>
                </button>
              );
            })}

            {isCustomLength && !isStructureCustomized ? (
              <div className="relative flex items-center h-10">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={customSectionCount}
                  onChange={(e) => handleCustomSectionChange(e.target.value)}
                  placeholder="1-50"
                  className="w-full h-10 px-2 text-center text-sm font-semibold bg-card border border-primary text-foreground rounded-xl outline-none focus:ring-1 focus:ring-primary/40 shadow-2xs"
                  autoFocus
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsCustomLength(true);
                  setIsStructureCustomized(false);
                  setLength("custom");
                  setSections(buildSections(reportType, customSectionCount));
                }}
                className={cn(
                  "h-10 rounded-xl text-xs font-medium border transition-all cursor-pointer flex flex-col items-center justify-center",
                  (isCustomLength || isStructureCustomized) && !length.includes("short")
                    ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                    : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <span>Custom</span>
                <span className="text-[10px] opacity-80">sections</span>
              </button>
            )}
          </div>
          {isStructureCustomized && (
            <p className="text-xs text-muted-foreground">
              Length is set to Custom because the structure has been customized.
            </p>
          )}
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-foreground">Options</Label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <Checkbox checked={includeSummary} onCheckedChange={(v) => setIncludeSummary(v === true)} />
              Executive summary
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <Checkbox checked={includeCitations} onCheckedChange={(v) => setIncludeCitations(v === true)} />
              Citations
            </label>
          </div>
        </div>

        <div className="flex justify-end mt-auto pt-4">
          <Button
            type="button"
            onClick={() => setStep(2)}
            className="h-10 px-6 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-md gap-2 cursor-pointer hover:opacity-95 transition-all"
          >
            Next
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  function renderStepTwo() {
    return (
      <div className="flex flex-col gap-5 min-h-[420px] animate-in fade-in slide-in-from-right-2 duration-150">
        {/* Instructions */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="brief-report" className="text-sm font-semibold text-foreground">
            Instructions <RequiredHint active={!hasSources} />
          </Label>
          <Textarea
            id="brief-report"
            ref={textareaRef}
            value={value.brief}
            onChange={(e) => update({ brief: e.target.value })}
            placeholder="What should the report focus on? Topics, questions, scope, audience..."
            className="min-h-[120px] max-h-[200px] text-xs resize-none break-all max-w-full overflow-x-hidden w-full"
            disabled={disabled}
          />
        </div>

        {/* Sources */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-foreground">
            Knowledge Sources <RequiredHint active={!hasInstructions} />
          </Label>
          <ReportSourcePopover
            sources={sources}
            selectedIds={value.sourceIds}
            onChange={(sourceIds) => update({ sourceIds })}
            required={!hasInstructions}
          />
        </div>

        {/* Customize Structure — opt-in */}
        <div className="flex flex-col gap-2 border border-border rounded-2xl bg-card p-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-foreground">Report Structure</Label>
              <p className="text-[10px] text-muted-foreground">
                {isStructureCustomized
                  ? `${sections.length} custom sections`
                  : `${effectiveSectionCount} sections auto-generated from ${length === "custom" ? "Custom" : LENGTHS.find((l) => l.id === length)?.title ?? "Medium"} length`}
              </p>
            </div>
            <CustomizeStructureButton expanded={showStructureEditor} onClick={handleToggleStructureEditor} />
          </div>
          {showStructureEditor && <StructureEditor sections={sections} onChange={handleStructureChange} />}
        </div>

        {/* Folder + Model */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Destination Folder</Label>
            <FolderPicker notebookId={notebookId} value={value.folderId} onChange={(folderId) => update({ folderId })} disabled={disabled} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">AI Model</Label>
            <ReportModelPopover
              models={models}
              selectedModel={value.model}
              onModelChange={(model) => update({ model })}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-auto pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep(1)}
            className="h-9 px-4 text-sm text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button
            type="button"
            className="h-10 px-6 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-md gap-2 cursor-pointer hover:opacity-95 transition-all"
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

  return (
    <div className="flex flex-col gap-5 font-sans text-foreground">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-sm font-semibold text-foreground">Report Builder</span>
          <Badge variant="outline" className="text-xs font-normal">Step {step} of 2</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div onClick={() => setStep(1)} className={cn("h-1.5 rounded-full transition-all cursor-pointer", step >= 1 ? "bg-primary" : "bg-muted")} />
          <div onClick={() => setStep(2)} className={cn("h-1.5 rounded-full transition-all cursor-pointer", step === 2 ? "bg-primary" : "bg-muted")} />
        </div>
      </div>
      {step === 1 ? renderStepOne() : renderStepTwo()}
    </div>
  );
}
