import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  Search,
  Cpu,
  BookOpen,
  Globe,
  FileText,
  Lightbulb,
  Brain,
  Sparkles,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Checkbox } from "@/shared/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { FolderPicker } from "@/features/notebooks";
import type { ModelOption } from "@/shared/api/models";
import { sourcesQueryOptions } from "@/shared/api/sources";
import { cn } from "@/shared/lib/utils";
import type { BaseMaterialFormProps, BriefFormData } from "./types";

// ============================================================================
// Module Constants
// ============================================================================

const CARD_COUNT_PRESETS = [10, 15, 20] as const;

const DIFFICULTIES = [
  { id: "easy", title: "Basic", description: "Simple definitions & recall", icon: Lightbulb },
  { id: "medium", title: "Standard", description: "Conceptual understanding", icon: Brain },
  { id: "hard", title: "Advanced", description: "Deep analysis & application", icon: Sparkles },
] as const;

type DifficultyId = (typeof DIFFICULTIES)[number]["id"];

const CARD_STYLES = [
  { id: "qa", title: "Q & A", description: "Classic question → answer format" },
  { id: "definition", title: "Definition", description: "Term → definition pairs" },
  { id: "cloze", title: "Fill-in-the-Blank", description: "Sentence with missing word" },
  { id: "mixed", title: "Mixed", description: "Combination of Q&A, Definitions, and Fill-in-the-Blank" },
] as const;

type CardStyleId = (typeof CARD_STYLES)[number]["id"];

// ============================================================================
// Flashcard Brief Form Component
// ============================================================================

export function FlashcardBriefForm({
  notebookId,
  models,
  value,
  onChange,
  onSubmit,
  submitLabel = "Generate Flashcards",
  disabled = false,
}: BaseMaterialFormProps) {
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // State
  const [cardCount, setCardCount] = useState<number>(value.questionCount ?? 10);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customVal, setCustomVal] = useState("25");
  const [difficulty, setDifficulty] = useState<DifficultyId>(value.difficulty ?? "medium");
  const [cardStyle, setCardStyle] = useState<CardStyleId>(value.cardStyle ?? "qa");

  // Queries
  const { data: sources = [] } = useQuery(sourcesQueryOptions(notebookId));

  // Derived state: sources OR instructions required (at least one)
  const hasSources = value.sourceIds.length > 0;
  const hasInstructions = value.brief.trim().length > 0;
  const canSubmit = !disabled && (hasSources || hasInstructions);

  const cardLabel = `${cardCount} ${
    cardCount === 1 ? "Card" : "Cards"
  }${cardCount >= 50 ? " (Max 50)" : ""}`;

  // Handlers
  const update = (patch: Partial<BriefFormData>) => {
    onChange({ ...value, ...patch });
  };

  // Sync internal state to parent brief form values
  useEffect(() => {
    update({ questionCount: cardCount, difficulty, cardStyle });
  }, [cardCount, difficulty, cardStyle]);

  const handleCustomChange = (raw: string) => {
    setCustomVal(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.min(50, Math.max(1, parsed));
      setCardCount(clamped);
    }
  };

  const handleCustomBlur = () => {
    let parsed = parseInt(customVal, 10);
    if (isNaN(parsed) || parsed < 1) parsed = 10;
    if (parsed > 50) parsed = 50;
    setCustomVal(String(parsed));
    setCardCount(parsed);
  };

  return (
    <div className="flex flex-col gap-4 font-sans text-foreground animate-in fade-in duration-150">

      {/* Card Style Toggle */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-foreground">Card Format</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CARD_STYLES.map((style) => {
            const selected = cardStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setCardStyle(style.id)}
                className={cn(
                  "h-9 rounded-xl text-xs font-medium border transition-all text-center cursor-pointer flex items-center justify-center gap-1.5",
                  selected
                    ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                    : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {selected && <Check className="size-3.5 text-primary-foreground shrink-0" />}
                {style.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty + Card Count in one row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-foreground">Difficulty</Label>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => {
              const selected = difficulty === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id)}
                  className={cn(
                    "flex-1 h-9 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center justify-center gap-1",
                    selected
                      ? "bg-primary text-primary-foreground border-primary font-semibold"
                      : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {d.title}
                </button>
              );
            })}
          </div>
        </div>

        <CardCountSelector
          cardLabel={cardLabel}
          cardCount={cardCount}
          isCustomMode={isCustomMode}
          customVal={customVal}
          onSelectPreset={(cnt) => {
            setIsCustomMode(false);
            setCardCount(cnt);
          }}
          onEnableCustom={() => {
            setIsCustomMode(true);
            const parsed = parseInt(customVal, 10) || 25;
            setCardCount(Math.min(50, Math.max(1, parsed)));
          }}
          onCustomChange={handleCustomChange}
          onCustomBlur={handleCustomBlur}
        />
      </div>

      {/* Instructions */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="brief-flashcards" className="text-sm font-medium text-foreground">
          Instructions{!hasSources && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        <Textarea
          id="brief-flashcards"
          ref={textareaRef}
          value={value.brief}
          onChange={(e) => update({ brief: e.target.value })}
          placeholder="What topics should these flashcards cover?"
          className="min-h-[80px] max-h-[200px] text-xs resize-none break-all max-w-full overflow-x-hidden w-full"
          disabled={disabled}
        />
      </div>

      {/* Sources */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-foreground">
          Sources{!hasInstructions && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        <FlashcardSourcePopover
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
          <FlashcardModelPopover
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
        className="w-full h-10 rounded-full border border-border/80 bg-panel-header-bg text-foreground font-medium text-sm shadow-md gap-2 cursor-pointer hover:bg-muted transition-colors disabled:bg-muted disabled:text-foreground disabled:opacity-100"
        disabled={!canSubmit}
        onClick={onSubmit}
      >
        {submitLabel}
      </Button>
    </div>
  );
}

// ============================================================================
// Flashcard Source Popover Component
// ============================================================================

function FlashcardSourcePopover({
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
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted">
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
          No sources in notebook. Flashcards will generate using general knowledge.
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
                checked ? "bg-muted text-foreground font-medium" : "hover:bg-muted text-muted-foreground"
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
      <div className="p-2.5 bg-muted flex justify-between items-center text-xs text-muted-foreground">
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
              <span className="truncate">{selectedIds.length === 0 ? "None selected (General Knowledge)" : `${selectedIds.length} source${selectedIds.length !== 1 ? "s" : ""} selected`}</span>
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
// Flashcard Model Popover Component
// ============================================================================

export function FlashcardModelPopover({
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
          isSelected ? "bg-muted text-foreground font-semibold" : "hover:bg-muted text-muted-foreground"
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

// ============================================================================
// Small Local Helper Components
// ============================================================================

function CardCountSelector({
  cardLabel,
  cardCount,
  isCustomMode,
  customVal,
  onSelectPreset,
  onEnableCustom,
  onCustomChange,
  onCustomBlur,
}: {
  cardLabel: string;
  cardCount: number;
  isCustomMode: boolean;
  customVal: string;
  onSelectPreset: (count: number) => void;
  onEnableCustom: () => void;
  onCustomChange: (raw: string) => void;
  onCustomBlur: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium text-foreground">Cards</Label>
        <span className="text-xs font-medium text-primary">{cardLabel}</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {CARD_COUNT_PRESETS.map((cnt) => {
          const selected = cardCount === cnt && !isCustomMode;
          return (
            <button
              key={cnt}
              type="button"
              onClick={() => onSelectPreset(cnt)}
              className={cn(
                "h-9 rounded-xl text-sm font-medium border transition-all text-center cursor-pointer flex items-center justify-center gap-1.5",
                selected
                  ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                  : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {selected && <Check className="size-3.5 text-primary-foreground shrink-0" />}
              {cnt}
            </button>
          );
        })}

        {isCustomMode ? (
          <div className="relative flex items-center h-9">
            <input
              type="number"
              min={1}
              max={50}
              value={customVal}
              onChange={(e) => onCustomChange(e.target.value)}
              onBlur={onCustomBlur}
              placeholder="1-50"
              className="w-full h-9 px-2 text-center text-sm font-semibold bg-card border border-primary text-foreground rounded-xl outline-none focus:ring-1 focus:ring-primary/40 shadow-2xs"
              autoFocus
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={onEnableCustom}
            className="h-9 rounded-xl text-sm font-medium border border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
          >
            Custom
          </button>
        )}
      </div>
    </div>
  );
}
