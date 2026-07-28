import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  ArrowRight,
  Check,
  BookOpen,
  Sparkles,
  Zap,
  X,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

export const Route = createFileRoute("/prototype/roadmap")({
  component: PrototypeRoadmapPage,
});

// ============================================================================
// Mock Data (Real Content from AI & LLM Systems)
// ============================================================================

interface Topic {
  id: string;
  title: string;
  description: string;
  order: number;
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
  phases: Phase[];
}

const MOCK_ROADMAP: RoadmapData = {
  id: "roadmap-ai-systems-2026",
  title: "Full-Stack AI & LLM Systems Architecture",
  description:
    "Master high-throughput LLM integration, vector databases, RAG evaluation, agentic workflows, and NestJS/React production deployment.",
  targetRole: "Senior AI Systems Engineer",
  phases: [
    {
      id: "phase-1",
      title: "Phase 1: Foundations of LLM Integration & Orchestration",
      description:
        "Understand tokenization, context window budget, streaming responses, and structured JSON outputs.",
      color: "#3B82F6",
      order: 1,
      topics: [
        {
          id: "topic-1-1",
          title: "Tokenization & Context Budget Management",
          description:
            "Analyze Byte-Pair Encoding (BPE), subword tokenization, context limits, and token-cost optimization techniques.",
          order: 1,
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
          order: 2,
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
          order: 3,
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
      color: "#8B5CF6",
      order: 2,
      topics: [
        {
          id: "topic-2-1",
          title: "Embedding Models & Distance Metrics",
          description:
            "Compare OpenAI text-embedding-3, Cohere, and voyage-3 embeddings using Cosine Similarity vs Dot Product.",
          order: 1,
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
          order: 2,
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
          order: 3,
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
      color: "#EC4899",
      order: 3,
      topics: [
        {
          id: "topic-3-1",
          title: "ReAct Pattern & Tool Loop Execution",
          description:
            "Implement Reason + Act loops with tool dispatching, execution sandboxing, and background task handoffs.",
          order: 1,
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
          order: 2,
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

  const handleStudyPhaseInChat = (phaseTitle: string) => {
    const promptText = `I'd like to study "${phaseTitle}" from my learning roadmap. Please act as my AI tutor for this phase.`;
    window.dispatchEvent(
      new CustomEvent("send-chat-prompt", {
        detail: { prompt: promptText, autoSend: true },
      }),
    );
  };

  const handleExplainTopicInChat = (topicTitle: string) => {
    const promptText = `Please explain the topic "${topicTitle}" in detail with practical examples.`;
    window.dispatchEvent(
      new CustomEvent("send-chat-prompt", {
        detail: { prompt: promptText, autoSend: true },
      }),
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans pb-24 selection:bg-primary/20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded-md border border-primary/20">
            ROADMAP LAB
          </span>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground">
              {MOCK_ROADMAP.title}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Testing 4 minimal layout & navigation paradigms
            </p>
          </div>
        </div>

        <Badge variant="outline" className="text-xs font-mono">
          Variant {currentVariant}
        </Badge>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-6">
        {currentVariant === "A" && (
          <VariantA_DuolingoPath
            roadmap={MOCK_ROADMAP}
            onStudyPhase={handleStudyPhaseInChat}
            onExplainTopic={handleExplainTopicInChat}
          />
        )}

        {currentVariant === "B" && (
          <VariantB_SplitMasterDetail
            roadmap={MOCK_ROADMAP}
            onStudyPhase={handleStudyPhaseInChat}
            onExplainTopic={handleExplainTopicInChat}
          />
        )}

        {currentVariant === "C" && (
          <VariantC_RoadmapShMindmap
            roadmap={MOCK_ROADMAP}
            onStudyPhase={handleStudyPhaseInChat}
            onExplainTopic={handleExplainTopicInChat}
          />
        )}

        {currentVariant === "D" && (
          <VariantD_MinimalMatrix
            roadmap={MOCK_ROADMAP}
            onStudyPhase={handleStudyPhaseInChat}
            onExplainTopic={handleExplainTopicInChat}
          />
        )}
      </main>

      {/* Floating Prototype Switcher */}
      <PrototypeSwitcher current={currentVariant} onChange={changeVariant} />
    </div>
  );
}

// ============================================================================
// Variant A: Duolingo Gamified Winding Path
// ============================================================================

function VariantA_DuolingoPath({
  roadmap,
  onStudyPhase,
  onExplainTopic,
}: {
  roadmap: RoadmapData;
  onStudyPhase: (title: string) => void;
  onExplainTopic: (title: string) => void;
}) {
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [activePhaseTitle, setActivePhaseTitle] = useState<string>("");

  // Sinusoidal X-offset pattern for Duolingo snake path
  const xOffsets = [0, 50, 80, 50, 0, -50, -80, -50];

  return (
    <div className="flex flex-col items-center gap-10 max-w-xl mx-auto animate-in fade-in duration-300 pb-20">
      {roadmap.phases.map((phase, pIdx) => (
        <div key={phase.id} className="w-full flex flex-col items-center gap-6">
          {/* Duolingo Unit Header Card */}
          <div className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-amber-950 rounded-3xl p-5 shadow-md border-b-4 border-amber-600 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-black uppercase tracking-wider text-amber-900/80 font-mono">
                UNIT 0{pIdx + 1}
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                {phase.title.replace(/^Phase \d+:\s*/i, "")}
              </h2>
              {phase.description && (
                <p className="text-xs text-amber-950/90 line-clamp-2 leading-relaxed">
                  {phase.description}
                </p>
              )}
            </div>

            <Button
              type="button"
              onClick={() => onStudyPhase(phase.title)}
              className="bg-amber-950 text-amber-100 hover:bg-amber-900 font-bold text-xs rounded-2xl h-10 px-4 shadow-sm shrink-0 border-b-2 border-black/40 cursor-pointer"
            >
              Study AI
            </Button>
          </div>

          {/* Winding Snake Nodes */}
          <div className="relative flex flex-col items-center gap-8 py-4 w-full">
            {phase.topics.map((topic, tIdx) => {
              const globalIndex = pIdx * 4 + tIdx;
              const xOffsetPx = xOffsets[globalIndex % xOffsets.length];
              const isSelected = activeTopic?.id === topic.id;

              return (
                <div
                  key={topic.id}
                  className="relative flex flex-col items-center"
                  style={{ transform: `translateX(${xOffsetPx}px)` }}
                >
                  {/* Duolingo 3D Node Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTopic(topic);
                      setActivePhaseTitle(phase.title);
                    }}
                    className={cn(
                      "size-16 sm:size-20 rounded-full font-black text-sm flex items-center justify-center cursor-pointer transition-all duration-150 shadow-md relative border-b-4 active:border-b-0 active:translate-y-1 select-none",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary-foreground/30 ring-4 ring-primary/30 scale-110"
                        : tIdx % 2 === 0
                        ? "bg-amber-400 text-amber-950 border-amber-600 hover:bg-amber-300"
                        : "bg-emerald-400 text-emerald-950 border-emerald-600 hover:bg-emerald-300",
                    )}
                    title={topic.title}
                  >
                    {tIdx % 3 === 0 ? (
                      <Check className="size-8 stroke-[3]" />
                    ) : tIdx % 3 === 1 ? (
                      <BookOpen className="size-7 stroke-[2.5]" />
                    ) : (
                      <Zap className="size-7 stroke-[2.5]" />
                    )}
                  </button>

                  <span className="text-[11px] font-bold text-foreground mt-2 max-w-[130px] text-center leading-tight truncate">
                    {topic.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Floating Duolingo Node Detail Drawer/Modal */}
      {activeTopic && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[90vw] max-w-md bg-card border-2 border-border shadow-2xl rounded-3xl p-5 flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-3">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-mono font-bold text-primary uppercase">
                {activePhaseTitle}
              </span>
              <h3 className="text-base font-black text-foreground leading-snug">
                {activeTopic.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveTopic(null)}
              className="size-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {activeTopic.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {activeTopic.description}
            </p>
          )}

          {activeTopic.keyTakeaways && (
            <div className="bg-muted/40 p-3 rounded-2xl flex flex-col gap-1.5 text-xs">
              <span className="font-mono font-bold text-primary uppercase text-[10px]">
                Key Objectives
              </span>
              <ul className="flex flex-col gap-1 text-muted-foreground">
                {activeTopic.keyTakeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              onClick={() => onExplainTopic(activeTopic.title)}
              className="w-full h-10 rounded-2xl bg-primary text-primary-foreground font-bold text-xs gap-2 cursor-pointer shadow-sm border-b-2 border-primary-foreground/30"
            >
              <Sparkles className="size-4" />
              <span>Explain in Chat</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Variant B: Split Master-Detail Workspace
// ============================================================================

function VariantB_SplitMasterDetail({
  roadmap,
  onStudyPhase,
  onExplainTopic,
}: {
  roadmap: RoadmapData;
  onStudyPhase: (title: string) => void;
  onExplainTopic: (title: string) => void;
}) {
  const [activePhaseId, setActivePhaseId] = useState<string>(roadmap.phases[0]?.id || "");
  const [activeTopicId, setActiveTopicId] = useState<string>(
    roadmap.phases[0]?.topics[0]?.id || "",
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [expandedPhaseIds, setExpandedPhaseIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    roadmap.phases.forEach((p) => {
      initial[p.id] = true;
    });
    return initial;
  });

  const togglePhaseAccordion = (phaseId: string) => {
    setExpandedPhaseIds((prev) => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  const allTopicsFlat = roadmap.phases.flatMap((phase) =>
    phase.topics.map((topic) => ({ topic, phase })),
  );

  const currentTopicIndex = allTopicsFlat.findIndex(
    (item) => item.topic.id === activeTopicId,
  );
  const currentItem = allTopicsFlat[currentTopicIndex] || allTopicsFlat[0];
  const prevItem = currentTopicIndex > 0 ? allTopicsFlat[currentTopicIndex - 1] : null;
  const nextItem =
    currentTopicIndex >= 0 && currentTopicIndex < allTopicsFlat.length - 1
      ? allTopicsFlat[currentTopicIndex + 1]
      : null;

  const activePhase = currentItem?.phase || roadmap.phases[0];
  const activeTopic = currentItem?.topic || activePhase?.topics[0];

  const selectTopic = (phaseId: string, topicId: string) => {
    setActivePhaseId(phaseId);
    setActiveTopicId(topicId);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="relative flex flex-col md:flex-row gap-6 items-start animate-in fade-in duration-200">
      {!isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-20 left-4 z-40 bg-background/70 backdrop-blur-md border border-border/80 text-foreground px-3 py-2 rounded-xl shadow-md transition-all hover:bg-background/90 hover:border-primary/40 flex items-center gap-2 text-xs font-mono font-medium cursor-pointer"
          title="Open Navigation Sidebar"
        >
          <PanelLeftOpen className="size-4 text-primary" />
          <span className="hidden sm:inline">Topics Navigation</span>
        </button>
      )}

      {isSidebarOpen && (
        <div className="w-full md:w-80 shrink-0 bg-card border border-border/80 rounded-2xl p-4 flex flex-col gap-4 sticky top-20 z-30 shadow-xs backdrop-blur-xs">
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Navigation
            </span>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1 font-mono transition-colors"
              title="Collapse Navigation Sidebar"
            >
              <PanelLeftClose className="size-4" />
              <span className="sr-only sm:not-sr-only">Hide</span>
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[65vh] overflow-y-auto pr-1 no-scrollbar">
            {roadmap.phases.map((phase) => {
              const isSelectedPhase = phase.id === activePhaseId;
              const isAccordionExpanded = !!expandedPhaseIds[phase.id];

              return (
                <div key={phase.id} className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      togglePhaseAccordion(phase.id);
                      if (!isSelectedPhase && phase.topics[0]) {
                        selectTopic(phase.id, phase.topics[0].id);
                      }
                    }}
                    className={cn(
                      "w-full text-left text-xs font-mono font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-2",
                      isSelectedPhase
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-foreground hover:bg-muted/50",
                    )}
                  >
                    <span className="truncate">
                      {phase.title.replace(/^Phase \d+:\s*/i, "")}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {isAccordionExpanded ? (
                        <ChevronDown className="size-3.5" />
                      ) : (
                        <ChevronRight className="size-3.5" />
                      )}
                    </span>
                  </button>

                  {isAccordionExpanded && (
                    <div className="pl-3 flex flex-col gap-1 border-l border-border/40 ml-2 py-0.5">
                      {phase.topics.map((t) => {
                        const isSelectedTopic = t.id === activeTopicId;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => selectTopic(phase.id, t.id)}
                            className={cn(
                              "w-full text-left text-xs px-2.5 py-1.5 rounded-md transition-colors cursor-pointer truncate",
                              isSelectedTopic
                                ? "bg-muted text-primary font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                            )}
                          >
                            {t.title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 w-full flex flex-col gap-6">
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono font-bold text-primary uppercase">
              Phase {roadmap.phases.findIndex((p) => p.id === activePhase?.id) + 1}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onStudyPhase(activePhase?.title || "")}
              className="h-8 px-3 rounded-xl text-xs font-medium border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 cursor-pointer"
            >
              Study Phase in Chat
            </Button>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
            {activePhase?.title}
          </h2>
          {activePhase?.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {activePhase.description}
            </p>
          )}
        </div>

        {activeTopic && (
          <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-6 flex flex-col gap-6 shadow-xs">
            <div className="flex flex-col gap-1.5 border-b border-border/40 pb-4">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">
                Topic Detail Focus
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                {activeTopic.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                {activeTopic.description}
              </p>
            </div>

            {activeTopic.keyTakeaways && activeTopic.keyTakeaways.length > 0 && (
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex flex-col gap-2.5">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                  Key Learning Objectives
                </span>
                <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
                  {activeTopic.keyTakeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span className="text-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end">
              <Button
                type="button"
                onClick={() => onExplainTopic(activeTopic.title)}
                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold cursor-pointer shadow-2xs"
              >
                Explain in Chat
              </Button>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/50">
              {prevItem ? (
                <button
                  type="button"
                  onClick={() => selectTopic(prevItem.phase.id, prevItem.topic.id)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer group max-w-[45%]"
                  title={`Go to previous topic: ${prevItem.topic.title}`}
                >
                  <ArrowLeft className="size-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                  <span className="truncate">Prev: {prevItem.topic.title}</span>
                </button>
              ) : (
                <div />
              )}

              {nextItem ? (
                <button
                  type="button"
                  onClick={() => selectTopic(nextItem.phase.id, nextItem.topic.id)}
                  className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline transition-colors cursor-pointer group max-w-[45%] text-right ml-auto"
                  title={`Go to next topic: ${nextItem.topic.title}`}
                >
                  <span className="truncate">Next: {nextItem.topic.title}</span>
                  <ArrowRight className="size-3.5 text-primary shrink-0" />
                </button>
              ) : (
                <div />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Variant C: Roadmap.sh Visual Mindmap / Flowchart Layout
// ============================================================================

function VariantC_RoadmapShMindmap({
  roadmap,
  onStudyPhase,
  onExplainTopic,
}: {
  roadmap: RoadmapData;
  onStudyPhase: (title: string) => void;
  onExplainTopic: (title: string) => void;
}) {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto animate-in fade-in duration-300 pb-20 select-none">
      {/* Roadmap.sh Root Header Badge */}
      <div className="bg-amber-300 dark:bg-amber-400 text-slate-950 font-black text-lg px-8 py-3 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider font-mono">
        {roadmap.title}
      </div>

      {/* Central Stem Spine */}
      <div className="relative w-full flex flex-col items-center gap-12 pt-4">
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary -translate-x-1/2 z-0" />

        {roadmap.phases.map((phase, pIdx) => (
          <div key={phase.id} className="relative z-10 w-full flex flex-col items-center gap-6">
            {/* Phase Milestone Box on Central Stem */}
            <div className="bg-amber-300 dark:bg-amber-400 text-slate-950 border-2 border-slate-900 rounded-2xl p-4 max-w-md w-full text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-2">
              <span className="text-[10px] font-mono font-extrabold uppercase bg-slate-900 text-amber-300 px-2 py-0.5 rounded-md">
                MILESTONE 0{pIdx + 1}
              </span>
              <h3 className="text-base font-black tracking-tight leading-snug">
                {phase.title.replace(/^Phase \d+:\s*/i, "")}
              </h3>
              <button
                type="button"
                onClick={() => onStudyPhase(phase.title)}
                className="mt-1 text-xs font-bold text-slate-950 bg-amber-100 hover:bg-white border-2 border-slate-900 rounded-xl px-3 py-1 cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Study Phase in Chat
              </button>
            </div>

            {/* Branching Sub-Topic Nodes Left & Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4">
              {phase.topics.map((t, tIdx) => {
                const isLeft = tIdx % 2 === 0;

                return (
                  <div
                    key={t.id}
                    className={cn(
                      "relative flex items-center",
                      isLeft ? "md:justify-end md:pr-6" : "md:justify-start md:pl-6",
                    )}
                  >
                    {/* Horizontal Dotted Connector Line */}
                    <div
                      className={cn(
                        "hidden md:block absolute top-1/2 border-t-2 border-dashed border-primary z-0 w-6",
                        isLeft ? "-right-0" : "-left-0",
                      )}
                    />

                    {/* Topic Box */}
                    <div
                      onClick={() => setSelectedTopic(t)}
                      className="group bg-card border-2 border-border hover:border-primary rounded-xl p-3.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] flex items-start justify-between gap-3 cursor-pointer transition-all hover:scale-[1.02] w-full max-w-sm z-10"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {t.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {t.description}
                        </span>
                      </div>
                      <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border border-primary/20">
                        ✓
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Roadmap.sh Interactive Topic Popover Dialog */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 bg-background/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-3xl p-6 max-w-md w-full flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-3">
              <h3 className="text-base font-extrabold text-foreground leading-snug">
                {selectedTopic.title}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                className="size-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {selectedTopic.description}
            </p>

            {selectedTopic.keyTakeaways && (
              <div className="bg-muted/40 p-3 rounded-2xl flex flex-col gap-1.5 text-xs">
                <span className="font-mono font-bold text-primary uppercase text-[10px]">
                  Key Objectives
                </span>
                <ul className="flex flex-col gap-1 text-muted-foreground">
                  {selectedTopic.keyTakeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                onClick={() => {
                  onExplainTopic(selectedTopic.title);
                  setSelectedTopic(null);
                }}
                className="w-full h-10 rounded-xl bg-amber-300 dark:bg-amber-400 text-slate-950 font-black text-xs border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                Explain in Chat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Variant D: Minimalist Scannable Matrix Grid
// ============================================================================

function VariantD_MinimalMatrix({
  roadmap,
  onStudyPhase,
  onExplainTopic,
}: {
  roadmap: RoadmapData;
  onStudyPhase: (title: string) => void;
  onExplainTopic: (title: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roadmap.phases.map((phase, pIdx) => (
          <div
            key={phase.id}
            className="bg-card border border-border/80 rounded-2xl p-5 flex flex-col gap-4 shadow-2xs hover:border-border transition-all"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-[10px] font-mono font-bold text-primary uppercase">
                  Phase 0{pIdx + 1}
                </span>
                <h3 className="text-base font-bold text-foreground leading-snug truncate">
                  {phase.title.replace(/^Phase \d+:\s*/i, "")}
                </h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onStudyPhase(phase.title)}
                className="h-7 px-2.5 rounded-lg text-xs font-medium border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 shrink-0 cursor-pointer"
              >
                Study Phase
              </Button>
            </div>

            <div className="flex flex-col gap-2.5">
              {phase.topics.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {t.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {t.description}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onExplainTopic(t.title)}
                    className="text-[11px] font-medium text-primary hover:underline shrink-0 cursor-pointer"
                  >
                    Explain
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Floating Prototype Switcher
// ============================================================================

function PrototypeSwitcher({
  current,
  onChange,
}: {
  current: "A" | "B" | "C" | "D";
  onChange: (v: "A" | "B" | "C" | "D") => void;
}) {
  const variants: Array<{ id: "A" | "B" | "C" | "D"; label: string; desc: string }> = [
    { id: "A", label: "A: Duolingo Path", desc: "Gamified serpentine winding node trail" },
    { id: "B", label: "B: Master-Detail", desc: "Sidebar index & right focus workspace" },
    { id: "C", label: "C: Roadmap.sh Mindmap", desc: "Flowchart backbone & branching nodes" },
    { id: "D", label: "D: Scannable Matrix", desc: "High-density 2-column grid" },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur-md border border-border/80 shadow-lg rounded-2xl p-1.5 flex items-center gap-1 max-w-[95vw] overflow-x-auto font-mono text-xs select-none">
      {variants.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onChange(v.id)}
          className={cn(
            "px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-all shrink-0 flex flex-col items-center gap-0.5",
            current === v.id
              ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          title={v.desc}
        >
          <span>{v.label}</span>
        </button>
      ))}
    </div>
  );
}
