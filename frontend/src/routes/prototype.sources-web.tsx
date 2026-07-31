import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronRight,
  FileText,
  Globe,
  Loader2,
  Plus,
  Search,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import {
  PrototypeSwitcher,
  type VariantOption,
} from "@/shared/ui/prototype-switcher";

export const Route = createFileRoute("/prototype/sources-web")({
  component: PrototypeSourcesPage,
});

// ============================================================================
// Mock data
// ============================================================================

interface LibrarySource {
  id: string;
  title: string;
  kind: "pdf" | "url" | "text";
}

interface SearchResult {
  id: string;
  title: string;
  site: string;
  description: string;
}

const INITIAL_LIBRARY: LibrarySource[] = [
  { id: "s1", title: "clean_code.pdf", kind: "pdf" },
  { id: "s2", title: "Clean Code — Wikipedia", kind: "url" },
  { id: "s3", title: "Code Smells — my notes", kind: "text" },
];

const MOCK_RESULTS: SearchResult[] = [
  {
    id: "r1",
    title: "Clean Code in JavaScript",
    site: "dev.to",
    description:
      "A practical DEV article on writing readable, maintainable JavaScript.",
  },
  {
    id: "r2",
    title: "The React Clean Code Guide",
    site: "robinwieruch.de",
    description:
      "Applying clean code principles to React components and hooks.",
  },
  {
    id: "r3",
    title: "Clean Code (book) — Wikipedia",
    site: "en.wikipedia.org",
    description:
      "Overview, chapters and reception of Robert C. Martin's Clean Code.",
  },
  {
    id: "r4",
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    site: "oreilly.com",
    description:
      "The official book page with reviews and table of contents.",
  },
  {
    id: "r5",
    title: "10 Clean Code Practices Every Developer Should Know",
    site: "freecodecamp.org",
    description: "Beginner-friendly rundown of the core principles.",
  },
  {
    id: "r6",
    title: "Code Smells — Refactoring Guru",
    site: "refactoring.guru",
    description: "Catalogue of code smells and how to fix them.",
  },
  {
    id: "r7",
    title: "Clean Code Fundamentals — Pluralsight",
    site: "pluralsight.com",
    description: "Video course on writing clean code for teams.",
  },
  {
    id: "r8",
    title: "Uncle Bob's Clean Code Talk — YouTube",
    site: "youtube.com",
    description: "The classic 2009 conference talk by Robert C. Martin.",
  },
  {
    id: "r9",
    title: "Clean Code Cheat Sheet",
    site: "github.com",
    description: "Community cheat sheet of naming, functions and comments.",
  },
  {
    id: "r10",
    title: "Agile Manifesto",
    site: "agilemanifesto.org",
    description: "The original principles of agile software development.",
  },
];

// ============================================================================
// Small shared presentational pieces (layout is the differentiator, not these)
// ============================================================================

function SiteIcon({ site }: { site: string }) {
  return (
    <span
      className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
      title={site}
    >
      <Globe className="size-3" />
    </span>
  );
}

function KindIcon({ kind }: { kind: LibrarySource["kind"] }) {
  const Icon = kind === "pdf" ? FileText : kind === "url" ? Globe : BookOpen;
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <Icon className="size-3" />
    </span>
  );
}

function runSimulation(cb: () => void) {
  window.setTimeout(cb, 1400);
}

// ============================================================================
// Variant A — Everything inline in the narrow sidebar (closest to the mock)
// ============================================================================

function VariantA() {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<"idle" | "searching" | "done">("idle");
  const [staged, setStaged] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [library, setLibrary] = useState<LibrarySource[]>(INITIAL_LIBRARY);
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const runSearch = () => {
    if (!query.trim() || phase === "searching") return;
    setPhase("searching");
    setExpanded(false);
    setFeedback(null);
    setSelected(new Set());
    runSimulation(() => {
      setStaged(MOCK_RESULTS);
      setPhase("done");
    });
  };

  const importSelected = () => {
    const chosen = staged.filter((r) => selected.has(r.id));
    setLibrary((prev) => [
      ...prev,
      ...chosen.map((r) => ({
        id: `new-${r.id}`,
        title: r.title,
        kind: "url" as const,
      })),
    ]);
    setStaged([]);
    setSelected(new Set());
    setPhase("idle");
    setQuery("");
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex min-h-[44px] items-center justify-between border-b border-border/60 px-3">
        <h2 className="text-sm font-semibold">Sources</h2>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="size-7 cursor-pointer">
            <Plus className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7 cursor-pointer">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {/* Add sources */}
        <div className="rounded-2xl border-2 border-dashed border-border/60 p-3 text-center text-[11px] text-muted-foreground/70 hover:border-primary/50 hover:bg-primary/5 cursor-pointer">
          Add sources (PDF, Web, Text)
        </div>

        {/* Research composer */}
        <div className="space-y-1.5 rounded-2xl border border-border/70 bg-card p-2">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && runSearch()}
            placeholder="Search sources about the book Clean Code..."
            className="field-sizing-content min-h-10 w-full resize-none rounded-xl bg-input/50 px-2.5 py-1.5 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 text-[11px]">
              <span className="flex items-center gap-1 rounded-lg bg-muted px-1.5 py-0.5 text-muted-foreground">
                <Globe className="size-3" /> Web
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-muted px-1.5 py-0.5 text-muted-foreground">
                <Sparkles className="size-3" /> Fast Research
              </span>
            </div>
            <Button
              size="icon"
              className="size-7 cursor-pointer rounded-full"
              onClick={runSearch}
              disabled={phase === "searching"}
            >
              {phase === "searching" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Searching state */}
        {phase === "searching" && (
          <div className="rounded-2xl border border-border/70 bg-card p-3 text-xs text-muted-foreground animate-pulse">
            <Sparkles className="mb-1 size-4 text-primary" />
            Researching the web for the best sources...
          </div>
        )}

        {/* Staged results card */}
        {phase === "done" && staged.length > 0 && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-2">
            <div className="flex items-center justify-between px-1 pb-1.5">
              <span className="flex items-center gap-1 text-[11px] font-semibold">
                <Sparkles className="size-3 text-primary" />
                Fast Research completed!
              </span>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-[11px] text-primary cursor-pointer"
              >
                {expanded ? "Hide" : "View"}
              </button>
            </div>

            {expanded && (
              <div className="mb-1.5 rounded-xl bg-card px-2 py-1.5 text-[11px] leading-relaxed text-muted-foreground">
                I searched the web and found 10 strong learning sources on
                Clean Code — from the original book to practical guides. Select
                the ones you want to add as sources.
              </div>
            )}

            <div className="space-y-1">
              {staged.slice(0, 5).map((r) => (
                <label
                  key={r.id}
                  className="flex cursor-pointer items-start gap-1.5 rounded-xl px-1.5 py-1 hover:bg-card"
                >
                  <Checkbox
                    checked={selected.has(r.id)}
                    onCheckedChange={() => toggle(r.id)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <SiteIcon site={r.site} />
                      <span className="truncate text-xs font-medium">
                        {r.title}
                      </span>
                    </div>
                    <p className="truncate pl-6 text-[10px] text-muted-foreground">
                      {r.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-1 flex items-center justify-between border-t border-border/50 px-1 pt-1.5">
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-6 cursor-pointer",
                    feedback === "up" && "text-primary",
                  )}
                  onClick={() =>
                    setFeedback((f) => (f === "up" ? null : "up"))
                  }
                >
                  <ThumbsUp className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-6 cursor-pointer",
                    feedback === "down" && "text-destructive",
                  )}
                  onClick={() =>
                    setFeedback((f) => (f === "down" ? null : "down"))
                  }
                >
                  <ThumbsDown className="size-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground cursor-pointer"
                  onClick={() => {
                    setStaged([]);
                    setPhase("idle");
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  className="h-6 cursor-pointer text-[11px]"
                  onClick={importSelected}
                  disabled={selected.size === 0}
                >
                  Import ({selected.size})
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Library */}
        <div className="pt-1">
          <div className="mb-1 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
            <span className="font-semibold">Imported sources</span>
          </div>
          <div className="space-y-0.5">
            {library.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 hover:bg-muted/60"
              >
                <span className="w-4 shrink-0 text-[10px] text-muted-foreground">
                  {i + 1}.
                </span>
                <KindIcon kind={s.kind} />
                <span className="truncate text-xs font-medium">
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Variant B — Research as a slide-over; the sidebar stays a clean library
// ============================================================================

function VariantB() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<"idle" | "searching" | "done">("idle");
  const [staged, setStaged] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [library, setLibrary] = useState<LibrarySource[]>(INITIAL_LIBRARY);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const runSearch = () => {
    if (!query.trim() || phase === "searching") return;
    setPhase("searching");
    runSimulation(() => {
      setStaged(MOCK_RESULTS);
      setPhase("done");
    });
  };

  const close = () => {
    setOpen(false);
    setStaged([]);
    setSelected(new Set());
    setPhase("idle");
    setQuery("");
  };

  const importSelected = () => {
    const chosen = staged.filter((r) => selected.has(r.id));
    setLibrary((prev) => [
      ...prev,
      ...chosen.map((r) => ({
        id: `new-${r.id}`,
        title: r.title,
        kind: "url" as const,
      })),
    ]);
    close();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex min-h-[44px] items-center justify-between border-b border-border/60 px-3">
        <h2 className="text-sm font-semibold">Sources</h2>
        <Button variant="ghost" size="icon" className="size-7 cursor-pointer">
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {/* Research trigger */}
        <button
          onClick={() => setOpen(true)}
          className="flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-primary/80 px-3 py-3 text-left text-white shadow-sm transition-colors hover:opacity-95"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-white/20">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-semibold">Research the web</div>
            <div className="truncate text-[10px] text-white/70">
              Find sources about any topic automatically
            </div>
          </div>
        </button>

        {/* Library stays the star */}
        <div className="pt-1 text-[11px] font-semibold text-muted-foreground">
          Imported sources
        </div>
        <div className="space-y-0.5">
          {library.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted/60"
            >
              <KindIcon kind={s.kind} />
              <span className="truncate text-xs font-medium">{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Slide-over */}
      {open && (
        <div className="absolute inset-0 z-40 flex">
          <div
            className="flex-1 bg-black/30"
            onClick={close}
            aria-hidden
          />
          <div className="flex h-full w-[380px] flex-col border-l border-border bg-background shadow-2xl">
            <div className="flex min-h-[44px] items-center justify-between border-b border-border/60 px-3">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="size-4 text-primary" /> Web Research
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 cursor-pointer"
                onClick={close}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
              <div className="space-y-1.5 rounded-2xl border border-border/70 bg-card p-2">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && runSearch()
                  }
                  placeholder="Search sources about the book Clean Code..."
                  className="field-sizing-content min-h-16 w-full resize-none rounded-xl bg-input/50 px-2.5 py-1.5 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
                />
                <div className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1 rounded-lg bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    <Sparkles className="size-3" /> Fast Research
                  </span>
                  <Button
                    size="icon"
                    className="size-7 cursor-pointer rounded-full"
                    onClick={runSearch}
                    disabled={phase === "searching"}
                  >
                    {phase === "searching" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {phase === "searching" && (
                <div className="rounded-2xl border border-border/70 bg-card p-3 text-xs text-muted-foreground animate-pulse">
                  Researching...
                </div>
              )}

              {phase === "done" && staged.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-primary">
                    <span className="flex items-center gap-1">
                      <Sparkles className="size-3" /> 10 sources found
                    </span>
                    <span className="font-normal text-muted-foreground">
                      {selected.size} selected
                    </span>
                  </div>
                  <div className="space-y-1">
                    {staged.map((r) => (
                      <label
                        key={r.id}
                        className="flex cursor-pointer items-start gap-1.5 rounded-xl px-1.5 py-1 hover:bg-muted/60"
                      >
                        <Checkbox
                          checked={selected.has(r.id)}
                          onCheckedChange={() => toggle(r.id)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <SiteIcon site={r.site} />
                            <span className="truncate text-xs font-medium">
                              {r.title}
                            </span>
                          </div>
                          <p className="truncate pl-6 text-[10px] text-muted-foreground">
                            {r.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            {phase === "done" && (
              <div className="border-t border-border/60 p-2">
                <Button
                  className="w-full cursor-pointer"
                  onClick={importSelected}
                  disabled={selected.size === 0}
                >
                  Import {selected.size} source{selected.size === 1 ? "" : "s"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Variant C — Tabs: "Sources" library and "Research" as separate surfaces
// ============================================================================

function VariantC() {
  const [tab, setTab] = useState<"sources" | "research">("sources");
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<"idle" | "searching" | "done">("idle");
  const [staged, setStaged] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [library, setLibrary] = useState<LibrarySource[]>(INITIAL_LIBRARY);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const runSearch = () => {
    if (!query.trim() || phase === "searching") return;
    setPhase("searching");
    runSimulation(() => {
      setStaged(MOCK_RESULTS);
      setPhase("done");
    });
  };

  const importSelected = () => {
    const chosen = staged.filter((r) => selected.has(r.id));
    setLibrary((prev) => [
      ...prev,
      ...chosen.map((r) => ({
        id: `new-${r.id}`,
        title: r.title,
        kind: "url" as const,
      })),
    ]);
    setStaged([]);
    setSelected(new Set());
    setPhase("idle");
    setQuery("");
    setTab("sources");
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex min-h-[44px] items-center justify-between border-b border-border/60 px-3">
        <h2 className="text-sm font-semibold">Sources</h2>
        <Button variant="ghost" size="icon" className="size-7 cursor-pointer">
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/60 p-1.5">
        {(
          [
            ["sources", "Sources"],
            ["research", "Research"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium transition-colors",
              tab === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {key === "research" && (
              <Sparkles
                className={cn(
                  "size-3",
                  tab === key ? "text-primary-foreground" : "text-primary",
                )}
              />
            )}
            {label}
          </button>
        ))}
      </div>

      {tab === "sources" ? (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="rounded-2xl border-2 border-dashed border-border/60 p-3 text-center text-[11px] text-muted-foreground/70 hover:border-primary/50 hover:bg-primary/5 cursor-pointer">
            Add sources (PDF, Web, Text)
          </div>
          <div className="pt-2 text-[11px] font-semibold text-muted-foreground">
            Imported sources
          </div>
          <div className="space-y-0.5">
            {library.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted/60"
              >
                <KindIcon kind={s.kind} />
                <span className="truncate text-xs font-medium">{s.title}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
          <div className="space-y-1.5 rounded-2xl border border-border/70 bg-card p-2">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && runSearch()
              }
              placeholder="Search sources about the book Clean Code..."
              className="field-sizing-content min-h-16 w-full resize-none rounded-xl bg-input/50 px-2.5 py-1.5 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
            />
            <div className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-1 rounded-lg bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                <Sparkles className="size-3" /> Fast Research
              </span>
              <Button
                size="icon"
                className="size-7 cursor-pointer rounded-full"
                onClick={runSearch}
                disabled={phase === "searching"}
              >
                {phase === "searching" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Search className="size-3.5" />
                )}
              </Button>
            </div>
          </div>

          {phase === "searching" && (
            <div className="rounded-2xl border border-border/70 bg-card p-3 text-xs text-muted-foreground animate-pulse">
              Researching...
            </div>
          )}

          {phase === "done" && staged.length > 0 && (
            <div className="space-y-1">
              {staged.map((r) => (
                <label
                  key={r.id}
                  className="flex cursor-pointer items-start gap-1.5 rounded-xl px-1.5 py-1 hover:bg-muted/60"
                >
                  <Checkbox
                    checked={selected.has(r.id)}
                    onCheckedChange={() => toggle(r.id)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <SiteIcon site={r.site} />
                      <span className="truncate text-xs font-medium">
                        {r.title}
                      </span>
                    </div>
                    <p className="truncate pl-6 text-[10px] text-muted-foreground">
                      {r.description}
                    </p>
                  </div>
                </label>
              ))}
              <Button
                className="w-full cursor-pointer"
                onClick={importSelected}
                disabled={selected.size === 0}
              >
                Import {selected.size} source{selected.size === 1 ? "" : "s"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Mock notebook workspace so variants are judged in context
// ============================================================================

function MockWorkspace({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border/70 px-4">
        <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BookOpen className="size-3.5" />
        </span>
        <span className="text-sm font-semibold">Clean Code Mastery</span>
        <Badge
          variant="outline"
          className="ml-auto border-primary/30 bg-primary/10 text-[10px] font-mono text-primary"
        >
          PROTOTYPE — sources-web
        </Badge>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="relative flex w-[320px] shrink-0 flex-col border-r border-border/70 bg-panel-bg">
          {children}
        </aside>

        <main className="flex flex-1 flex-col gap-3 overflow-hidden bg-background p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Chat — the study assistant
            </span>
            <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[10px] text-muted-foreground">
              <Globe className="size-3" /> GPT-5 Mini
            </span>
          </div>
          <div className="flex-1 space-y-2">
            {[
              "What are the core principles of Clean Code?",
              "Explain the difference between a code smell and a bug.",
            ].map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-xs",
                  i % 2 === 0
                    ? "bg-primary/10 text-foreground"
                    : "ml-auto bg-muted text-muted-foreground",
                )}
              >
                {m}
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-input/50 px-3 py-2 text-xs text-muted-foreground">
            Ask anything about your sources...
          </div>
        </main>

        <aside className="hidden w-[220px] shrink-0 flex-col gap-2 border-l border-border/70 p-3 lg:flex">
          <span className="text-[11px] font-semibold text-muted-foreground">
            Study materials
          </span>
          {["Quiz", "Flashcards", "Mind Map"].map((m) => (
            <div
              key={m}
              className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-2.5 py-2 text-xs"
            >
              <FileText className="size-3.5 text-muted-foreground" />
              {m}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

// ============================================================================
// Page + switcher
// ============================================================================

const VARIANTS: VariantOption[] = [
  {
    key: "A",
    name: "Inline composer",
    description: "Research composer + staged card live in the narrow sidebar",
  },
  {
    key: "B",
    name: "Slide-over",
    description: "Research opens a wide slide-over; sidebar stays a clean library",
  },
  {
    key: "C",
    name: "Tabs",
    description: "Sources / Research as separate tabs in the panel",
  },
];

function PrototypeSourcesPage() {
  const [variant, setVariant] = useState("A");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("variant")?.toUpperCase();
    if (v && VARIANTS.some((x) => x.key === v)) setVariant(v);
  }, []);

  const changeVariant = (v: string) => {
    setVariant(v);
    const url = new URL(window.location.href);
    url.searchParams.set("variant", v);
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <MockWorkspace>
      {variant === "A" && <VariantA />}
      {variant === "B" && <VariantB />}
      {variant === "C" && <VariantC />}
      <PrototypeSwitcher
        variants={VARIANTS}
        currentVariantKey={variant}
        onVariantChange={changeVariant}
      />
    </MockWorkspace>
  );
}
