import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Map,
  Clock,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  BookOpen,
  Link2,
  Trophy,
  Target,
  Zap,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

export const Route = createFileRoute("/prototype/roadmap")({
  component: PrototypeRoadmapPage,
});

// ============================================================================
// Comprehensive Mock Roadmap Data
// ============================================================================

interface Topic {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  order: number;
  resources?: Array<{ title: string; type: "article" | "doc" | "video"; url: string }>;
  keyTakeaways?: string[];
}

interface Phase {
  id: string;
  title: string;
  description: string;
  color: string;
  order: number;
  topics: Topic[];
}

interface RoadmapData {
  id: string;
  title: string;
  description: string;
  targetRole?: string;
  totalEstimatedMinutes: number;
  phases: Phase[];
}

const MOCK_ROADMAP: RoadmapData = {
  id: "roadmap-ai-systems-2026",
  title: "Full-Stack AI & LLM Systems Architecture",
  description:
    "Master high-throughput LLM integration, vector databases, RAG evaluation, agentic workflows, and NestJS/React production deployment.",
  targetRole: "Senior AI Systems Engineer",
  totalEstimatedMinutes: 480, // 8 hours
  phases: [
    {
      id: "phase-1",
      title: "Phase 1: Foundations of LLM Integration & Orchestration",
      description:
        "Understand tokenization, context window budget, streaming responses, and structured JSON outputs.",
      color: "#3B82F6", // Blue
      order: 1,
      topics: [
        {
          id: "topic-1-1",
          title: "Tokenization & Context Budget Management",
          description:
            "Analyze Byte-Pair Encoding (BPE), subword tokenization, context limits, and token-cost optimization techniques.",
          estimatedMinutes: 45,
          order: 1,
          resources: [
            { title: "OpenAI Tokenizer Playground & Math", type: "doc", url: "#" },
            { title: "Managing Large Context Windows in Practice", type: "article", url: "#" },
          ],
          keyTakeaways: [
            "BPE converts text into integer tokens",
            "Context window includes both input prompt and output completion",
            "Truncation strategies prevent cost overruns",
          ],
        },
        {
          id: "topic-1-2",
          title: "Streaming Responses with Server-Sent Events (SSE)",
          description:
            "Implement resilient chunk streaming using NestJS controllers, EventStreams, and React async iterators.",
          estimatedMinutes: 60,
          order: 2,
          resources: [
            { title: "MDN Guide to Server-Sent Events", type: "doc", url: "#" },
            { title: "Building Fluid AI Streaming UI with React 19", type: "video", url: "#" },
          ],
          keyTakeaways: [
            "SSE allows low-latency chunked response delivery",
            "Handle stream abort signals gracefully on UI unmount",
          ],
        },
        {
          id: "topic-1-3",
          title: "Structured Outputs & Zod Schema Enforcement",
          description:
            "Enforce strict JSON schema validation for function calling and deterministic AI payload parsing.",
          estimatedMinutes: 45,
          order: 3,
          resources: [
            { title: "Zod Schema Validation in AI Pipelines", type: "doc", url: "#" },
          ],
          keyTakeaways: [
            "Constrain model outputs to strict JSON schemas",
            "Fallback auto-repair retries for invalid LLM payloads",
          ],
        },
      ],
    },
    {
      id: "phase-2",
      title: "Phase 2: Vector Databases & RAG Pipelines",
      description:
        "Build scalable Retrieval-Augmented Generation (RAG) systems with embeddings, hybrid search, and re-ranking.",
      color: "#8B5CF6", // Purple
      order: 2,
      topics: [
        {
          id: "topic-2-1",
          title: "Embedding Models & Distance Metrics",
          description:
            "Compare OpenAI text-embedding-3, Cohere, and voyage-3 embeddings using Cosine Similarity vs Dot Product.",
          estimatedMinutes: 50,
          order: 1,
          resources: [
            { title: "Vector Embeddings Primer for Engineers", type: "article", url: "#" },
          ],
          keyTakeaways: [
            "Cosine similarity measures direction regardless of magnitude",
            "Normalize vectors for fast inner product search",
          ],
        },
        {
          id: "topic-2-2",
          title: "Hybrid Search (Dense + Sparse BM25) & Re-ranking",
          description:
            "Combine semantic dense vectors with keyword-based sparse search and Cohere Rerank for maximum precision.",
          estimatedMinutes: 70,
          order: 2,
          resources: [
            { title: "Hybrid Search Architecture Deep Dive", type: "article", url: "#" },
            { title: "Re-ranking Models Benchmark", type: "doc", url: "#" },
          ],
          keyTakeaways: [
            "Dense search captures concepts; sparse captures exact acronyms/IDs",
            "Cross-encoder reranking dramatically improves top-k retrieval relevance",
          ],
        },
        {
          id: "topic-2-3",
          title: "Document Chunking Strategies & Context Enrichment",
          description:
            "Explore fixed-size, sentence-boundary, recursive markdown, and semantic parent-child document chunking.",
          estimatedMinutes: 55,
          order: 3,
          resources: [
            { title: "Chunking Strategies for Production RAG", type: "video", url: "#" },
          ],
          keyTakeaways: [
            "Parent-child chunking preserves broad context while embedding small snippets",
            "Overlap prevents losing split semantic units",
          ],
        },
      ],
    },
    {
      id: "phase-3",
      title: "Phase 3: Autonomous Agent Workflows & Tool Call Execution",
      description:
        "Design multi-agent orchestrators, reactive loops, state persistence, and human-in-the-loop approvals.",
      color: "#EC4899", // Pink
      order: 3,
      topics: [
        {
          id: "topic-3-1",
          title: "ReAct Pattern & Tool Loop Execution",
          description:
            "Implement Reason + Act loops with tool dispatching, execution sandboxing, and background task handoffs.",
          estimatedMinutes: 75,
          order: 1,
          resources: [
            { title: "ReAct: Synergizing Reasoning and Acting in LLMs", type: "doc", url: "#" },
          ],
          keyTakeaways: [
            "Agents iterate between thought, action selection, and observation",
            "Always wrap external tool calls in timeouts and validation checks",
          ],
        },
        {
          id: "topic-3-2",
          title: "Subagent Delegation & Parallel Execution",
          description:
            "Distribute complex multi-step reasoning tasks across isolated background subagents with state synchronization.",
          estimatedMinutes: 80,
          order: 2,
          resources: [
            { title: "Multi-Agent System Topologies and Patterns", type: "article", url: "#" },
          ],
          keyTakeaways: [
            "Subagents maintain separate, focused context windows",
            "Parent orchestrator coordinates subtask completion",
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Main Prototype Page Component
// ============================================================================

export function PrototypeRoadmapPage() {
  const [currentVariant, setCurrentVariant] = useState<"A" | "B" | "C" | "D">("A");
  const [completedTopics, setCompletedTopics] = useState<Record<string, boolean>>({
    "topic-1-1": true,
  });

  // Sync variant from URL param if available
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

  const toggleTopic = (id: string) => {
    setCompletedTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resetProgress = () => {
    setCompletedTopics({});
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

  // Overall Stats
  const allTopics = useMemo(() => {
    return MOCK_ROADMAP.phases.flatMap((p) => p.topics);
  }, []);

  const totalTopicsCount = allTopics.length;
  const completedCount = useMemo(() => {
    return allTopics.filter((t) => completedTopics[t.id]).length;
  }, [allTopics, completedTopics]);

  const progressPercent = Math.round((completedCount / totalTopicsCount) * 100);

  const completedMinutes = useMemo(() => {
    return allTopics
      .filter((t) => completedTopics[t.id])
      .reduce((sum, t) => sum + t.estimatedMinutes, 0);
  }, [allTopics, completedTopics]);

  const remainingMinutes = MOCK_ROADMAP.totalEstimatedMinutes - completedMinutes;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans pb-24 selection:bg-primary/20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-2xs">
            <Map className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-foreground">
                Roadmap Study Material Lab
              </h1>
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono uppercase px-2 py-0.5"
              >
                Prototype Route
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Testing 4 distinct layout & UX paradigms for learning roadmap materials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetProgress}
            className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            Reset Progress
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
        {currentVariant === "A" && (
          <VariantA_VerticalQuest
            roadmap={MOCK_ROADMAP}
            completedTopics={completedTopics}
            onToggleTopic={toggleTopic}
            progressPercent={progressPercent}
            completedCount={completedCount}
            totalTopicsCount={totalTopicsCount}
            remainingMinutes={remainingMinutes}
          />
        )}

        {currentVariant === "B" && (
          <VariantB_KanbanBoard
            roadmap={MOCK_ROADMAP}
            completedTopics={completedTopics}
            onToggleTopic={toggleTopic}
            completedCount={completedCount}
            totalTopicsCount={totalTopicsCount}
          />
        )}

        {currentVariant === "C" && (
          <VariantC_FocusRunner
            roadmap={MOCK_ROADMAP}
            completedTopics={completedTopics}
            onToggleTopic={toggleTopic}
            progressPercent={progressPercent}
            completedCount={completedCount}
          />
        )}

        {currentVariant === "D" && (
          <VariantD_SplitMatrix
            roadmap={MOCK_ROADMAP}
            completedTopics={completedTopics}
            onToggleTopic={toggleTopic}
            progressPercent={progressPercent}
            completedCount={completedCount}
            totalTopicsCount={totalTopicsCount}
            completedMinutes={completedMinutes}
            remainingMinutes={remainingMinutes}
          />
        )}
      </main>

      {/* Floating Prototype Switcher */}
      <PrototypeSwitcher current={currentVariant} onChange={changeVariant} />
    </div>
  );
}

// ============================================================================
// Variant A: Milestone Quest / Vertical Learning Trail
// ============================================================================

function VariantA_VerticalQuest({
  roadmap,
  completedTopics,
  onToggleTopic,
  progressPercent,
  completedCount,
  totalTopicsCount,
  remainingMinutes,
}: {
  roadmap: RoadmapData;
  completedTopics: Record<string, boolean>;
  onToggleTopic: (id: string) => void;
  progressPercent: number;
  completedCount: number;
  totalTopicsCount: number;
  remainingMinutes: number;
}) {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & Overview Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-0.5">
                {roadmap.targetRole}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Clock className="size-3.5" /> ~{Math.round(roadmap.totalEstimatedMinutes / 60)} hrs total
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {roadmap.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {roadmap.description}
            </p>
          </div>

          {/* Radial/Linear Progress Card */}
          <div className="shrink-0 bg-background/80 backdrop-blur border border-border/80 rounded-2xl p-4 w-full md:w-64 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground flex items-center gap-1">
                <Trophy className="size-3.5 text-amber-500" /> Overall Progress
              </span>
              <span className="font-mono font-bold text-foreground">{progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40 font-mono">
              <span>{completedCount}/{totalTopicsCount} topics</span>
              <span>{remainingMinutes > 0 ? `${remainingMinutes}m left` : "Done!"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Learning Trail Container */}
      <div className="relative pl-3 md:pl-6 space-y-12">
        {/* Vertical Connecting Line */}
        <div className="absolute left-[27px] md:left-[39px] top-6 bottom-6 w-1 bg-gradient-to-b from-primary via-purple-500/40 to-muted rounded-full" />

        {roadmap.phases.map((phase, pIdx) => {
          const phaseTopics = phase.topics;
          const completedInPhase = phaseTopics.filter((t) => completedTopics[t.id]).length;
          const isPhaseDone = completedInPhase === phaseTopics.length;

          return (
            <div key={phase.id} className="relative space-y-4">
              {/* Phase Header Milestone Badge */}
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "relative z-10 size-10 md:size-12 rounded-2xl flex items-center justify-center font-bold font-mono text-sm md:text-base transition-all duration-300 shadow-md border-2",
                    isPhaseDone
                      ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20"
                      : "bg-card text-foreground border-border group-hover:border-primary",
                  )}
                  style={{
                    borderColor: !isPhaseDone ? phase.color : undefined,
                  }}
                >
                  {isPhaseDone ? (
                    <CheckCircle2 className="size-6 text-white" />
                  ) : (
                    <span>0{pIdx + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0 bg-card border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      {phase.title}
                      {isPhaseDone && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                          Phase Complete
                        </Badge>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      {phase.description}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 font-mono text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-xl border border-border/40">
                    <Zap className="size-3.5 text-amber-500" />
                    <span>{completedInPhase} / {phaseTopics.length} Topics</span>
                  </div>
                </div>
              </div>

              {/* Topics Grid / Cards */}
              <div className="pl-14 md:pl-16 grid grid-cols-1 md:grid-cols-2 gap-3">
                {phase.topics.map((topic) => {
                  const isDone = !!completedTopics[topic.id];

                  return (
                    <div
                      key={topic.id}
                      className={cn(
                        "group relative rounded-2xl border p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3",
                        isDone
                          ? "bg-muted/30 border-emerald-500/30 opacity-80 hover:opacity-100"
                          : "bg-card border-border hover:border-primary/50 hover:shadow-md",
                      )}
                      onClick={() => setSelectedTopic(topic)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTopic(topic.id);
                            }}
                            className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          >
                            {isDone ? (
                              <CheckCircle2 className="size-5 text-emerald-500 fill-emerald-500/20" />
                            ) : (
                              <Circle className="size-5 text-muted-foreground/60 group-hover:text-primary" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <h4
                              className={cn(
                                "text-sm font-semibold leading-tight transition-colors",
                                isDone ? "line-through text-muted-foreground" : "text-foreground group-hover:text-primary",
                              )}
                            >
                              {topic.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                              {topic.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3 text-primary" />
                          {topic.estimatedMinutes} mins
                        </span>
                        {topic.resources && topic.resources.length > 0 && (
                          <span className="flex items-center gap-1 text-primary hover:underline">
                            <BookOpen className="size-3" />
                            {topic.resources.length} resources
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Topic Detail Drawer Modal */}
      {selectedTopic && (
        <TopicDetailModal
          topic={selectedTopic}
          isDone={!!completedTopics[selectedTopic.id]}
          onToggle={() => onToggleTopic(selectedTopic.id)}
          onClose={() => setSelectedTopic(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
// Variant B: Modular Sprint / Kanban Board Layout
// ============================================================================

function VariantB_KanbanBoard({
  roadmap,
  completedTopics,
  onToggleTopic,
  completedCount,
  totalTopicsCount,
}: {
  roadmap: RoadmapData;
  completedTopics: Record<string, boolean>;
  onToggleTopic: (id: string) => void;
  completedCount: number;
  totalTopicsCount: number;
}) {
  const [filterMode, setFilterMode] = useState<"all" | "todo" | "done">("all");
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Kanban Header Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs">
              Kanban View
            </Badge>
            <h2 className="text-lg font-bold text-foreground">{roadmap.title}</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organized by Phase columns with quick status filters and topic cards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl bg-muted p-1 text-xs border border-border/40">
            <button
              onClick={() => setFilterMode("all")}
              className={cn(
                "px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer",
                filterMode === "all" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              All ({totalTopicsCount})
            </button>
            <button
              onClick={() => setFilterMode("todo")}
              className={cn(
                "px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer",
                filterMode === "todo" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              To Do ({totalTopicsCount - completedCount})
            </button>
            <button
              onClick={() => setFilterMode("done")}
              className={cn(
                "px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer",
                filterMode === "done" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Done ({completedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Phase Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {roadmap.phases.map((phase, pIdx) => {
          const phaseTopics = phase.topics.filter((t) => {
            const isDone = !!completedTopics[t.id];
            if (filterMode === "todo") return !isDone;
            if (filterMode === "done") return isDone;
            return true;
          });

          const totalInPhase = phase.topics.length;
          const completedInPhase = phase.topics.filter((t) => completedTopics[t.id]).length;
          const phaseProgress = Math.round((completedInPhase / totalInPhase) * 100);

          return (
            <div
              key={phase.id}
              className="bg-card/70 border border-border/80 rounded-2xl p-4 space-y-4 flex flex-col min-h-[450px]"
            >
              {/* Column Header */}
              <div className="space-y-2 pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: phase.color }}
                    />
                    <h3 className="text-sm font-bold text-foreground">
                      Phase 0{pIdx + 1}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-medium text-muted-foreground">
                    {completedInPhase}/{totalInPhase}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-foreground line-clamp-1">
                  {phase.title.replace(/^Phase \d+:\s*/, "")}
                </h4>

                {/* Mini phase progress bar */}
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${phaseProgress}%`,
                      backgroundColor: phase.color,
                    }}
                  />
                </div>
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-3">
                {phaseTopics.length === 0 ? (
                  <div className="h-32 flex items-center justify-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                    No topics match filter
                  </div>
                ) : (
                  phaseTopics.map((topic) => {
                    const isDone = !!completedTopics[topic.id];

                    return (
                      <div
                        key={topic.id}
                        onClick={() => setActiveTopic(topic)}
                        className={cn(
                          "group rounded-xl border p-3.5 transition-all duration-200 cursor-pointer space-y-2 bg-background hover:border-primary/50 shadow-2xs hover:shadow-sm",
                          isDone && "opacity-60 border-border/50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={cn(
                              "text-xs font-semibold leading-snug line-clamp-2",
                              isDone ? "line-through text-muted-foreground" : "text-foreground group-hover:text-primary",
                            )}
                          >
                            {topic.title}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTopic(topic.id);
                            }}
                            className="shrink-0 text-muted-foreground hover:text-primary cursor-pointer mt-0.5"
                          >
                            {isDone ? (
                              <CheckCircle2 className="size-4 text-emerald-500" />
                            ) : (
                              <Circle className="size-4 text-muted-foreground/50" />
                            )}
                          </button>
                        </div>

                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {topic.description}
                        </p>

                        <div className="flex items-center justify-between pt-1 font-mono text-[10px] text-muted-foreground">
                          <span className="bg-muted px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="size-2.5 text-primary" />
                            {topic.estimatedMinutes}m
                          </span>
                          {topic.keyTakeaways && (
                            <span>{topic.keyTakeaways.length} takeaways</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeTopic && (
        <TopicDetailModal
          topic={activeTopic}
          isDone={!!completedTopics[activeTopic.id]}
          onToggle={() => onToggleTopic(activeTopic.id)}
          onClose={() => setActiveTopic(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
// Variant C: Guided Focus / Step-by-Step Study Runner
// ============================================================================

function VariantC_FocusRunner({
  roadmap,
  completedTopics,
  onToggleTopic,
  progressPercent,
  completedCount,
}: {
  roadmap: RoadmapData;
  completedTopics: Record<string, boolean>;
  onToggleTopic: (id: string) => void;
  progressPercent: number;
  completedCount: number;
}) {
  const allTopics = useMemo(() => {
    return roadmap.phases.flatMap((p) =>
      p.topics.map((t) => ({ ...t, phaseTitle: p.title, phaseColor: p.color })),
    );
  }, [roadmap]);

  const [activeIndex, setActiveIndex] = useState(0);
  const currentTopic = allTopics[activeIndex] || allTopics[0];
  const isDone = !!completedTopics[currentTopic.id];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
      {/* Left Sidebar: Step Stepper Navigation */}
      <div className="lg:col-span-4 bg-card border border-border rounded-3xl p-5 space-y-5 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary uppercase tracking-wider font-mono">
              Guided Focus Mode
            </span>
            <span className="text-xs font-mono font-bold text-foreground">
              {activeIndex + 1} / {allTopics.length}
            </span>
          </div>
          <h2 className="text-base font-bold text-foreground">Topic Navigator</h2>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
            <span>{completedCount} Completed</span>
            <span>{progressPercent}% Complete</span>
          </div>
        </div>

        {/* Topic List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {allTopics.map((t, idx) => {
            const tDone = !!completedTopics[t.id];
            const isActive = idx === activeIndex;

            return (
              <div
                key={t.id}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs",
                  isActive
                    ? "bg-primary/10 border-primary font-semibold text-foreground shadow-2xs"
                    : tDone
                      ? "bg-muted/30 border-border/40 text-muted-foreground"
                      : "bg-background border-border/70 hover:bg-muted/40 text-foreground",
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTopic(t.id);
                    }}
                    className="shrink-0 cursor-pointer"
                  >
                    {tDone ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : (
                      <Circle className="size-4 text-muted-foreground" />
                    )}
                  </button>
                  <span className="truncate">{t.title}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                  {t.estimatedMinutes}m
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Stage: Active Topic Studio */}
      <div className="lg:col-span-8 bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        {/* Phase Header Tag */}
        <div className="flex items-center justify-between gap-4">
          <Badge
            className="text-xs px-3 py-1 font-semibold"
            style={{
              backgroundColor: `${currentTopic.phaseColor}20`,
              color: currentTopic.phaseColor,
              borderColor: `${currentTopic.phaseColor}40`,
            }}
          >
            {currentTopic.phaseTitle}
          </Badge>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((prev) => prev - 1)}
              className="h-8 rounded-xl text-xs gap-1 cursor-pointer"
            >
              <ChevronLeft className="size-3.5" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={activeIndex === allTopics.length - 1}
              onClick={() => setActiveIndex((prev) => prev + 1)}
              className="h-8 rounded-xl text-xs gap-1 cursor-pointer"
            >
              Next <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Main Topic Header */}
        <div className="space-y-3 border-b border-border/60 pb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            {currentTopic.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentTopic.description}
          </p>

          <div className="flex items-center gap-4 pt-2 font-mono text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 bg-muted px-3 py-1 rounded-xl">
              <Clock className="size-3.5 text-primary" /> Est. Time: {currentTopic.estimatedMinutes} Minutes
            </span>
            <button
              onClick={() => onToggleTopic(currentTopic.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-xl border transition-all cursor-pointer font-sans text-xs font-semibold",
                isDone
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  : "bg-primary text-primary-foreground border-primary hover:opacity-90",
              )}
            >
              {isDone ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5" />}
              {isDone ? "Completed Topic" : "Mark as Complete"}
            </button>
          </div>
        </div>

        {/* Key Takeaways Section */}
        {currentTopic.keyTakeaways && (
          <div className="space-y-3 bg-muted/30 border border-border/60 rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary font-mono flex items-center gap-1.5">
              <Target className="size-4" /> Core Learning Objectives
            </h3>
            <ul className="space-y-2">
              {currentTopic.keyTakeaways.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground">
                  <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Study Resources */}
        {currentTopic.resources && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
              <BookOpen className="size-4 text-primary" /> Recommended Study Material
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentTopic.resources.map((res, idx) => (
                <a
                  key={idx}
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all text-xs group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Link2 className="size-4 text-primary shrink-0" />
                    <span className="font-medium text-foreground truncate group-hover:text-primary">
                      {res.title}
                    </span>
                  </div>
                  <ExternalLink className="size-3.5 text-muted-foreground shrink-0 group-hover:text-primary" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Variant D: Interactive Node Tree & Split-Pane Matrix
// ============================================================================

function VariantD_SplitMatrix({
  roadmap,
  completedTopics,
  onToggleTopic,
  progressPercent,
  completedCount,
  totalTopicsCount,
  completedMinutes,
  remainingMinutes,
}: {
  roadmap: RoadmapData;
  completedTopics: Record<string, boolean>;
  onToggleTopic: (id: string) => void;
  progressPercent: number;
  completedCount: number;
  totalTopicsCount: number;
  completedMinutes: number;
  remainingMinutes: number;
}) {
  const [activeTopic, setActiveTopic] = useState<Topic>(roadmap.phases[0].topics[0]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Matrix Dashboard Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-mono uppercase">Completion</span>
          <p className="text-2xl font-extrabold text-foreground font-mono">{progressPercent}%</p>
          <span className="text-[11px] text-emerald-600 font-medium">
            {completedCount} of {totalTopicsCount} topics
          </span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-mono uppercase">Time Spent</span>
          <p className="text-2xl font-extrabold text-foreground font-mono">
            {Math.round(completedMinutes / 60 * 10) / 10}h
          </p>
          <span className="text-[11px] text-muted-foreground font-mono">
            of {Math.round(roadmap.totalEstimatedMinutes / 60)}h target
          </span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-mono uppercase">Time Remaining</span>
          <p className="text-2xl font-extrabold text-indigo-500 font-mono">
            {Math.round(remainingMinutes / 60 * 10) / 10}h
          </p>
          <span className="text-[11px] text-muted-foreground font-mono">
            {remainingMinutes} minutes left
          </span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-mono uppercase">Phases</span>
          <p className="text-2xl font-extrabold text-purple-500 font-mono">
            0{roadmap.phases.length}
          </p>
          <span className="text-[11px] text-muted-foreground font-mono">Structured Track</span>
        </div>
      </div>

      {/* Split Pane: Tree Matrix on Left, Focus Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Matrix Tree */}
        <div className="lg:col-span-5 bg-card border border-border rounded-3xl p-5 space-y-4 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
            Curriculum Structure Tree
          </h3>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {roadmap.phases.map((phase, pIdx) => (
              <div key={phase.id} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground bg-muted/50 p-2.5 rounded-xl border border-border/40">
                  <div className="size-2.5 rounded-full" style={{ backgroundColor: phase.color }} />
                  <span>Phase {pIdx + 1}: {phase.title}</span>
                </div>

                <div className="pl-4 space-y-1.5 border-l-2 border-border/50 ml-3">
                  {phase.topics.map((t) => {
                    const isSelected = activeTopic.id === t.id;
                    const isDone = !!completedTopics[t.id];

                    return (
                      <div
                        key={t.id}
                        onClick={() => setActiveTopic(t)}
                        className={cn(
                          "p-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between gap-2 border",
                          isSelected
                            ? "bg-primary/10 border-primary font-semibold text-foreground shadow-2xs"
                            : isDone
                              ? "bg-muted/20 border-transparent text-muted-foreground"
                              : "hover:bg-muted/40 border-transparent text-foreground",
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTopic(t.id);
                            }}
                            className="shrink-0 cursor-pointer"
                          >
                            {isDone ? (
                              <CheckCircle2 className="size-4 text-emerald-500" />
                            ) : (
                              <Circle className="size-4 text-muted-foreground/60" />
                            )}
                          </button>
                          <span className="truncate">{t.title}</span>
                        </div>

                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                          {t.estimatedMinutes}m
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Inspector Panel */}
        <div className="lg:col-span-7 bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm sticky top-20">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
              Topic Inspector
            </span>
            <Button
              size="sm"
              variant={completedTopics[activeTopic.id] ? "outline" : "default"}
              onClick={() => onToggleTopic(activeTopic.id)}
              className="h-8 rounded-xl text-xs gap-1.5 cursor-pointer font-semibold"
            >
              {completedTopics[activeTopic.id] ? (
                <>
                  <CheckCircle2 className="size-3.5 text-emerald-500" /> Completed
                </>
              ) : (
                <>
                  <Circle className="size-3.5" /> Mark Done
                </>
              )}
            </Button>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {activeTopic.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {activeTopic.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-2xl border border-border/60 font-mono text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px]">ESTIMATED TIME</span>
              <span className="font-bold text-foreground">{activeTopic.estimatedMinutes} Minutes</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">STATUS</span>
              <span className={cn("font-bold", completedTopics[activeTopic.id] ? "text-emerald-600" : "text-amber-500")}>
                {completedTopics[activeTopic.id] ? "Completed" : "In Progress"}
              </span>
            </div>
          </div>

          {activeTopic.keyTakeaways && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold font-mono text-foreground uppercase">
                Key Learning Takeaways
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {activeTopic.keyTakeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTopic.resources && (
            <div className="space-y-2 pt-2 border-t border-border/60">
              <h4 className="text-xs font-bold font-mono text-foreground uppercase">
                Study Material Links
              </h4>
              <div className="space-y-2">
                {activeTopic.resources.map((r, i) => (
                  <a
                    key={i}
                    href={r.url}
                    className="flex items-center justify-between text-xs p-2.5 rounded-xl border border-border bg-background hover:bg-muted/40 transition-all text-primary font-medium"
                  >
                    <span>{r.title}</span>
                    <ExternalLink className="size-3.5 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Topic Detail Modal / Dialog Component
// ============================================================================

function TopicDetailModal({
  topic,
  isDone,
  onToggle,
  onClose,
}: {
  topic: Topic;
  isDone: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-mono">
            Topic Focus
          </Badge>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xs font-mono cursor-pointer px-2 py-1 rounded-lg hover:bg-muted"
          >
            Esc to close ✕
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground tracking-tight">{topic.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{topic.description}</p>
        </div>

        {topic.keyTakeaways && (
          <div className="space-y-2 bg-muted/40 p-4 rounded-2xl border border-border/50 text-xs">
            <span className="font-bold font-mono text-primary uppercase text-[10px]">
              Key Objectives
            </span>
            <ul className="space-y-1.5 text-muted-foreground">
              {topic.keyTakeaways.map((pt, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
            <Clock className="size-3.5 text-primary" /> Est. {topic.estimatedMinutes} mins
          </span>
          <Button
            size="sm"
            onClick={onToggle}
            className={cn(
              "rounded-xl text-xs gap-1.5 cursor-pointer font-semibold",
              isDone ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-primary text-primary-foreground",
            )}
          >
            {isDone ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5" />}
            {isDone ? "Mark Incomplete" : "Mark Complete"}
          </Button>
        </div>
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
  { key: "A", label: "A — Vertical Trail", desc: "Milestone nodes with vertical path timeline" },
  { key: "B", label: "B — Kanban Board", desc: "Columnar sprint phases with status filters" },
  { key: "C", label: "C — Focus Runner", desc: "Guided step-by-step 1-topic study mode" },
  { key: "D", label: "D — Split Matrix", desc: "Interactive tree matrix & live inspector" },
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

        {/* Current Variant Button & Selector */}
        <div className="flex items-center gap-1.5 px-2">
          {VARIANTS.map((v) => (
            <button
              key={v.key}
              onClick={() => onChange(v.key)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-semibold font-mono transition-all cursor-pointer",
                current === v.key
                  ? "bg-primary text-primary-foreground shadow-sm scale-105"
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
