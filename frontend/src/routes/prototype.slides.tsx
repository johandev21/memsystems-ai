import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import Reveal from "reveal.js";
import "reveal.js/reveal.css";
import "reveal.js/theme/black.css";
import {
  Presentation,
  Maximize2,
  FileText,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

export const Route = createFileRoute("/prototype/slides")({
  component: PrototypeSlidesPage,
});

// ============================================================================
// Comprehensive Mock Slide Deck Data
// ============================================================================

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  codeSnippet?: string;
  notes?: string;
  badge?: string;
  color?: string;
}

interface SlideDeckData {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  date: string;
  slides: Slide[];
}

const MOCK_SLIDES: SlideDeckData = {
  id: "deck-llm-orchestration-2026",
  title: "Building Production Multi-Agent LLM Systems",
  subtitle: "Architecture, State Persistence, Tool Sandboxing & Context Synthesis",
  author: "MemSystems AI Engineering",
  date: "2026 Edition",
  slides: [
    {
      id: "slide-1",
      title: "Building Production Multi-Agent LLM Systems",
      subtitle: "Architecture, State Persistence, Tool Sandboxing & Context Synthesis",
      bullets: [
        "Why single-prompt setups break down at enterprise scale",
        "Orchestration topologies: Router, ReAct Loop, Subagent Teams",
        "Managing context budget, background tasks, and streaming state",
      ],
      notes: "Welcome everyone! In this presentation we are breaking down production architecture for multi-agent systems.",
      badge: "Overview",
      color: "from-blue-600 to-indigo-600",
    },
    {
      id: "slide-2",
      title: "The ReAct Loop Pattern",
      subtitle: "Reasoning + Acting + Observation Cycle",
      bullets: [
        "1. Thought: Model reasons about the user request and required tools",
        "2. Action: Model formats structured JSON tool invocation",
        "3. Observation: System executes tool and feeds result back into prompt context",
      ],
      codeSnippet: `// ReAct Loop Handler
async function executeAgentLoop(prompt: string) {
  const thoughts = await llm.generateThought(prompt);
  const action = await llm.selectTool(thoughts);
  const result = await sandbox.run(action);
  return llm.synthesize(result);
}`,
      notes: "Emphasize that tool execution must run in sandboxed background tasks with timeouts.",
      badge: "Core Pattern",
      color: "from-purple-600 to-pink-600",
    },
    {
      id: "slide-3",
      title: "Subagent Delegation & Isolation",
      subtitle: "Preventing Context Window Blowup",
      bullets: [
        "Parent Orchestrator spawns isolated worker subagents for heavy tasks",
        "Subagents have focused prompts and distinct tool definitions",
        "Parent receives only final concise output, preserving main context budget",
      ],
      notes: "Subagent isolation prevents long research logs from filling up the main user conversation window.",
      badge: "Scalability",
      color: "from-emerald-600 to-teal-600",
    },
    {
      id: "slide-4",
      title: "Streaming Responses with SSE",
      subtitle: "Low Latency Chunk Delivery",
      bullets: [
        "Server-Sent Events stream chunks directly over standard HTTP",
        "React iterators append text deltas dynamically in real-time",
        "Graceful abort signals handle component unmount without backend leaks",
      ],
      codeSnippet: `// NestJS SSE Endpoint
@Sse('stream')
streamResponse(): Observable<MessageEvent> {
  return this.aiService.streamChunks().pipe(
    map((chunk) => ({ data: chunk }))
  );
}`,
      notes: "Always handle abort controllers on the frontend when user cancels generation.",
      badge: "Streaming",
      color: "from-amber-600 to-orange-600",
    },
    {
      id: "slide-5",
      title: "Summary & Best Practices",
      subtitle: "Key Takeaways for Engineers",
      bullets: [
        "Enforce strict Zod schemas for deterministic tool payloads",
        "Deconstruct complex workflows into targeted subagent tasks",
        "Monitor context token budgets and implement auto-pruning",
      ],
      notes: "Q&A time. Encourage attendees to check out the GitHub repository prototypes.",
      badge: "Takeaways",
      color: "from-indigo-600 to-blue-600",
    },
  ],
};

// ============================================================================
// Main Prototype Page Component
// ============================================================================

export function PrototypeSlidesPage() {
  const [currentVariant, setCurrentVariant] = useState<"A" | "B" | "C" | "D">("A");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("variant")?.toUpperCase();
    if (v && ["A", "B", "C", "D"].includes(v)) {
      setCurrentVariant(v as "A" | "B" | "C" | "D");
    }
  }, []);

  const changeVariant = (v: "A" | "B" | "C" | "D") => {
    setCurrentVariant(v);
    const url = new URL(window.location.href);
    url.searchParams.set("variant", v);
    window.history.replaceState({}, "", url.toString());
  };

  // Keyboard navigation for prototype switcher
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const variants: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];
      const currentIndex = variants.indexOf(currentVariant);

      if (e.key === "ArrowLeft") {
        const prev = variants[(currentIndex - 1 + variants.length) % variants.length];
        changeVariant(prev);
      } else if (e.key === "ArrowRight") {
        const next = variants[(currentIndex + 1) % variants.length];
        changeVariant(next);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentVariant]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans pb-24 selection:bg-primary/20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center border border-purple-500/20 shadow-2xs">
            <Presentation className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-foreground">
                Slide Deck Presentation Studio Lab
              </h1>
              <Badge
                variant="outline"
                className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px] font-mono uppercase px-2 py-0.5"
              >
                Prototype Route
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Testing 4 distinct presentation engines (Reveal.js HTML Deck, Keynote Studio, Pitch Deck Grid, Linear Reader).
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
        {currentVariant === "A" && <VariantA_RevealJSEngine deck={MOCK_SLIDES} />}
        {currentVariant === "B" && <VariantB_KeynoteStudio deck={MOCK_SLIDES} />}
        {currentVariant === "C" && <VariantC_PitchDeckGrid deck={MOCK_SLIDES} />}
        {currentVariant === "D" && <VariantD_LinearReader deck={MOCK_SLIDES} />}
      </main>

      {/* Floating Prototype Switcher */}
      <PrototypeSwitcher current={currentVariant} onChange={changeVariant} />
    </div>
  );
}

// ============================================================================
// Variant A: Reveal.js HTML Presentation Engine
// ============================================================================

function VariantA_RevealJSEngine({ deck }: { deck: SlideDeckData }) {
  const revealRef = useRef<HTMLDivElement>(null);
  const revealInstance = useRef<Reveal.Api | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

  useEffect(() => {
    if (!revealRef.current) return;

    const instance = new Reveal(revealRef.current, {
      embedded: true,
      hash: false,
      keyboard: true,
      progress: true,
      controls: true,
      center: true,
      transition: "slide", // slide, fade, convex, zoom
      backgroundTransition: "fade",
    });

    instance.initialize().then(() => {
      revealInstance.current = instance;
      instance.on("slidechanged", (event: any) => {
        setCurrentSlideIdx(event.indexh);
      });
    });

    return () => {
      try {
        instance.destroy();
      } catch {}
    };
  }, []);

  const activeSlide = deck.slides[currentSlideIdx] || deck.slides[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Control Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-600 text-white border-purple-600 text-xs font-mono">
              Reveal.js Framework Engine
            </Badge>
            <span className="text-xs font-mono text-muted-foreground font-semibold">
              Slide {currentSlideIdx + 1} of {deck.slides.length}
            </span>
          </div>
          <h2 className="text-sm font-bold text-foreground mt-1">
            {deck.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showNotes ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowNotes(!showNotes)}
            className="h-8 text-xs gap-1.5 cursor-pointer font-medium"
          >
            <FileText className="size-3.5" /> Speaker Notes
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (revealRef.current) {
                revealRef.current.requestFullscreen();
              }
            }}
            className="h-8 text-xs gap-1.5 cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-medium"
          >
            <Maximize2 className="size-3.5" /> Present Fullscreen
          </Button>
        </div>
      </div>

      {/* Reveal.js Stage Container (16:9 Widescreen) */}
      <div className="relative w-full aspect-[16/9] max-h-[550px] rounded-3xl overflow-hidden border border-border shadow-2xl bg-slate-950">
        <div ref={revealRef} className="reveal w-full h-full">
          <div className="slides">
            {deck.slides.map((slide, idx) => (
              <section key={slide.id} className="p-8">
                {slide.badge && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-4">
                    {slide.badge}
                  </span>
                )}
                <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p className="text-base text-slate-300 italic mb-6">
                    {slide.subtitle}
                  </p>
                )}

                <ul className="text-left space-y-3 max-w-2xl mx-auto text-sm sm:text-base text-slate-200">
                  {slide.bullets.map((b, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2.5">
                      <span className="size-2 rounded-full bg-purple-400 mt-2 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                {slide.codeSnippet && (
                  <pre className="mt-6 text-xs text-left bg-slate-900 border border-slate-800 p-4 rounded-xl text-emerald-400 font-mono overflow-x-auto max-w-2xl mx-auto">
                    <code>{slide.codeSnippet}</code>
                  </pre>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>

      {/* Speaker Notes Panel */}
      {showNotes && activeSlide.notes && (
        <div className="bg-card border border-purple-500/30 rounded-2xl p-5 space-y-2 animate-in slide-in-from-top-2 duration-200 shadow-2xs">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-purple-600 uppercase">
            <FileText className="size-4" /> Presenter Speaker Notes
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed font-sans">
            {activeSlide.notes}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Variant B: Keynote Studio (Framer Motion 3D Cards & Slide Drawer)
// ============================================================================

function VariantB_KeynoteStudio({ deck }: { deck: SlideDeckData }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const activeSlide = deck.slides[currentIdx];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Keynote Header Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">
            KEY
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-tight">
              {deck.title}
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Apple Keynote Studio Theme • {deck.slides.length} Slides
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs font-mono">
            Keynote 3D Engine
          </Badge>
        </div>
      </div>

      {/* Main 16:9 Slide Stage */}
      <div className="relative aspect-[16/9] max-h-[500px] rounded-3xl overflow-hidden border border-border shadow-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 md:p-14 flex flex-col justify-between text-white">
        {/* Top Slide Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
            {activeSlide.badge || "Keynote"}
          </span>
          <span className="text-xs font-mono text-slate-400">
            0{currentIdx + 1} / 0{deck.slides.length}
          </span>
        </div>

        {/* Center Slide Content */}
        <div className="space-y-4 max-w-3xl mx-auto w-full text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
            {activeSlide.title}
          </h2>
          {activeSlide.subtitle && (
            <p className="text-sm md:text-base text-slate-300 italic">
              {activeSlide.subtitle}
            </p>
          )}

          <ul className="text-left space-y-2.5 text-xs md:text-sm text-slate-200 max-w-xl mx-auto pt-2">
            {activeSlide.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom Slide Footer */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-3">
          <span>{deck.author}</span>
          <span>{deck.date}</span>
        </div>
      </div>

      {/* Slide Thumbnails Drawer */}
      <div className="grid grid-cols-5 gap-3">
        {deck.slides.map((s, idx) => {
          const isActive = idx === currentIdx;

          return (
            <div
              key={s.id}
              onClick={() => setCurrentIdx(idx)}
              className={cn(
                "aspect-[16/9] rounded-xl border p-2.5 transition-all cursor-pointer flex flex-col justify-between bg-card hover:border-primary",
                isActive ? "border-indigo-500 ring-2 ring-indigo-500/40 shadow-md" : "border-border/70 opacity-70",
              )}
            >
              <span className="text-[10px] font-mono font-bold text-muted-foreground">0{idx + 1}</span>
              <span className="text-[11px] font-bold text-foreground line-clamp-1">{s.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Variant C: Pitch Deck Grid & Slide Inspector
// ============================================================================

function VariantC_PitchDeckGrid({ deck }: { deck: SlideDeckData }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeSlide = deck.slides[activeIdx];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-2xs">
        <div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
            Pitch Deck Grid View
          </Badge>
          <h2 className="text-base font-bold text-foreground mt-1">{deck.title}</h2>
        </div>
        <span className="text-xs font-mono text-muted-foreground">{deck.slides.length} Slide Cards</span>
      </div>

      {/* Grid of Slide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {deck.slides.map((s, idx) => (
          <div
            key={s.id}
            onClick={() => setActiveIdx(idx)}
            className={cn(
              "bg-card border rounded-2xl p-5 space-y-3 cursor-pointer transition-all duration-200 hover:border-primary shadow-2xs",
              activeIdx === idx ? "border-primary ring-1 ring-primary/30 shadow-md" : "border-border",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-primary">SLIDE 0{idx + 1}</span>
              {s.badge && <Badge variant="outline" className="text-[10px]">{s.badge}</Badge>}
            </div>

            <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
              {s.title}
            </h3>

            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {s.bullets[0]}
            </p>
          </div>
        ))}
      </div>

      {/* Active Inspector Drawer */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
        <span className="text-xs font-mono font-bold text-primary uppercase">
          Slide Inspector: 0{activeIdx + 1} - {activeSlide.title}
        </span>
        <ul className="space-y-2 text-sm text-foreground">
          {activeSlide.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// Variant D: Linear Reader / Continuous Scroll Deck
// ============================================================================

function VariantD_LinearReader({ deck }: { deck: SlideDeckData }) {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-2xl p-4 text-center space-y-1 shadow-2xs">
        <Badge variant="outline" className="bg-teal-500/10 text-teal-600 border-teal-500/20 text-xs">
          Continuous Scroll Deck Reader
        </Badge>
        <h2 className="text-lg font-bold text-foreground">{deck.title}</h2>
        <p className="text-xs text-muted-foreground">{deck.subtitle}</p>
      </div>

      <div className="space-y-8">
        {deck.slides.map((s, idx) => (
          <div
            key={s.id}
            className="bg-card border border-border rounded-3xl p-8 space-y-4 shadow-sm hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <span className="text-xs font-mono font-bold text-primary">SLIDE {idx + 1} OF {deck.slides.length}</span>
              {s.badge && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{s.badge}</Badge>}
            </div>

            <h3 className="text-xl font-bold text-foreground tracking-tight">{s.title}</h3>

            <ul className="space-y-2.5 text-sm text-foreground/90">
              {s.bullets.map((b, bi) => (
                <li key={bi} className="flex items-start gap-2.5">
                  <span className="size-2 rounded-full bg-primary mt-2 shrink-0" />
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Floating Prototype Switcher Bar
// ============================================================================

interface PrototypeSwitcherProps {
  current: "A" | "B" | "C" | "D";
  onChange: (v: "A" | "B" | "C" | "D") => void;
}

const VARIANTS: Array<{ key: "A" | "B" | "C" | "D"; label: string; desc: string }> = [
  { key: "A", label: "A — Reveal.js Framework", desc: "Open-source HTML presentation engine with 3D transitions & speaker notes" },
  { key: "B", label: "B — Keynote Studio", desc: "Apple Keynote widescreen deck with thumbnail drawer" },
  { key: "C", label: "C — Pitch Deck Grid", desc: "Startup pitch deck card grid & inspector" },
  { key: "D", label: "D — Linear Reader", desc: "Continuous scroll deck document reader" },
];

function PrototypeSwitcher({ current, onChange }: PrototypeSwitcherProps) {
  const currentIndex = VARIANTS.findIndex((v) => v.key === current);

  const prevVariant = () => {
    const nextIdx = (currentIndex - 1 + VARIANTS.length) % VARIANTS.length;
    onChange(VARIANTS[nextIdx].key);
  };

  const nextVariant = () => {
    const nextIdx = (currentIndex + 1) % VARIANTS.length;
    onChange(VARIANTS[nextIdx].key);
  };

  const currentObj = VARIANTS[currentIndex];

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] sm:w-auto">
      <div className="flex items-center gap-2 bg-slate-900/95 dark:bg-slate-950/95 text-white border border-slate-700/80 shadow-2xl rounded-full px-3 py-2 backdrop-blur-md">
        {/* Prev Arrow */}
        <button
          type="button"
          onClick={prevVariant}
          title="Previous variant (←)"
          className="size-8 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors text-slate-300 hover:text-white cursor-pointer shrink-0"
        >
          <ArrowLeft className="size-4" />
        </button>

        {/* Current Variant Buttons */}
        <div className="flex items-center gap-1.5 px-2">
          {VARIANTS.map((v) => (
            <button
              key={v.key}
              onClick={() => onChange(v.key)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-semibold font-mono transition-all cursor-pointer",
                current === v.key
                  ? "bg-purple-600 text-white shadow-sm scale-105"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
              title={v.desc}
            >
              {v.key}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

        {/* Current Variant Title */}
        <div className="text-xs hidden sm:block pr-2 truncate max-w-[200px]">
          <span className="font-bold text-white block truncate">{currentObj.label}</span>
        </div>

        {/* Next Arrow */}
        <button
          type="button"
          onClick={nextVariant}
          title="Next variant (→)"
          className="size-8 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors text-slate-300 hover:text-white cursor-pointer shrink-0"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
