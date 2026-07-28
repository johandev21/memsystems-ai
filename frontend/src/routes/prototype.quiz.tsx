import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  Zap,
  Timer,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  ListFilter,
  Sparkles,
  BarChart3,
  Award,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

export const Route = createFileRoute("/prototype/quiz")({
  component: PrototypeQuizPage,
});

// ============================================================================
// Comprehensive Mock Quiz Data
// ============================================================================

interface QuizOption {
  text: string;
  explanation: string;
}

interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionIndex: number;
  category?: string;
}

interface QuizData {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
}

const MOCK_QUIZ: QuizData = {
  id: "quiz-ai-architecture-2026",
  title: "Advanced LLM & Vector Systems Architecture Quiz",
  description:
    "Test your engineering knowledge on context window optimization, RAG re-ranking, embeddings math, and agentic tool loop patterns.",
  questions: [
    {
      id: "q1",
      prompt: "Which distance metric is scale-invariant and relies purely on the angle between two embedding vectors?",
      category: "Embeddings & Math",
      options: [
        {
          text: "Euclidean Distance (L2)",
          explanation: "Euclidean distance measures absolute geometric distance in space, making it sensitive to vector magnitude.",
        },
        {
          text: "Cosine Similarity",
          explanation: "Correct! Cosine similarity measures the cosine of the angle between two non-zero vectors, normalizing for magnitude.",
        },
        {
          text: "Manhattan Distance (L1)",
          explanation: "Manhattan distance sums grid-like absolute coordinate differences, which varies with vector magnitude.",
        },
        {
          text: "Dot Product (Inner Product)",
          explanation: "Dot product combines both angle and vector magnitude unless the vectors are explicitly normalized to unit length.",
        },
      ],
      correctOptionIndex: 1,
    },
    {
      id: "q2",
      prompt: "In RAG pipelines, what is the key advantage of Parent-Child document chunking over simple fixed-character chunking?",
      category: "Retrieval & RAG",
      options: [
        {
          text: "It eliminates the need for vector embeddings entirely",
          explanation: "Embeddings are still required to search and index parent or child chunks in the vector store.",
        },
        {
          text: "It indexes small granular snippets for precise vector match, but returns the larger parent document context to the LLM",
          explanation: "Correct! Child chunks allow high-density semantic retrieval, while passing parent blocks prevents lost surrounding context.",
        },
        {
          text: "It compresses all text chunks into binary gzip streams",
          explanation: "Compression reduces storage bytes but is unrelated to semantic retrieval accuracy or context preservation.",
        },
        {
          text: "It guarantees zero latency response from the embedding API",
          explanation: "Embedding generation API latency depends on batch size and network distance, not chunk hierarchy.",
        },
      ],
      correctOptionIndex: 1,
    },
    {
      id: "q3",
      prompt: "How does Server-Sent Events (SSE) differ from WebSockets for streaming AI text responses?",
      category: "Streaming & Protocol",
      options: [
        {
          text: "SSE is lightweight, unidirectional (server to client), and runs natively over standard HTTP/1.1 or HTTP/2",
          explanation: "Correct! SSE provides simple text/event-stream HTTP streaming without full-duplex protocol negotiation overhead.",
        },
        {
          text: "SSE requires complex bi-directional binary protocol handshakes",
          explanation: "WebSockets require protocol upgrades and bi-directional framing, whereas SSE operates over standard HTTP.",
        },
        {
          text: "WebSockets cannot stream text chunks to web browsers",
          explanation: "WebSockets can stream text chunks, but require extra infrastructure for bi-directional state management.",
        },
        {
          text: "SSE only works with XML format responses",
          explanation: "SSE streams raw UTF-8 text chunks, JSON buffers, or markdown content.",
        },
      ],
      correctOptionIndex: 0,
    },
    {
      id: "q4",
      prompt: "What is the primary role of Cross-Encoder Re-ranking in modern dense search systems?",
      category: "Search & Re-ranking",
      options: [
        {
          text: "To pre-calculate vector embeddings offline",
          explanation: "Cross-encoders evaluate query and document text simultaneously online; they are not pre-calculated bi-encoders.",
        },
        {
          text: "To score full text attention across query and candidates to dramatically boost top-k retrieval precision",
          explanation: "Correct! Bi-encoders perform fast candidate retrieval, while cross-encoders re-rank candidate results with deep joint attention.",
        },
        {
          text: "To automatically split PDF documents into pages",
          explanation: "Document parsing and layout analysis happen during ingestion, prior to search and re-ranking.",
        },
        {
          text: "To encrypt database tables at rest",
          explanation: "Re-ranking is a search relevance mechanism, not a database disk encryption protocol.",
        },
      ],
      correctOptionIndex: 1,
    },
    {
      id: "q5",
      prompt: "In autonomous agent systems, what is the core loop mechanism of the ReAct framework?",
      category: "Agent Architecture",
      options: [
        {
          text: "Render, Action, Component, State",
          explanation: "That resembles React UI framework concepts, not the AI agent ReAct pattern.",
        },
        {
          text: "Reasoning (Thought) → Action (Tool Call) → Observation (Tool Result)",
          explanation: "Correct! ReAct combines verbal reasoning traces with tool execution feedback in a continuous cycle.",
        },
        {
          text: "Randomize, Evaluate, Act, Terminate",
          explanation: "ReAct uses structured reasoning and prompt context rather than randomized action selection.",
        },
        {
          text: "Recursive Assembly & Code Translation",
          explanation: "ReAct is an LLM prompting & tool orchestration pattern, not a compiler translation pipeline.",
        },
      ],
      correctOptionIndex: 1,
    },
  ],
};

// ============================================================================
// Main Prototype Page Component
// ============================================================================

export function PrototypeQuizPage() {
  const [currentVariant, setCurrentVariant] = useState<"A" | "B" | "C" | "D">("A");
  const [answers, setAnswers] = useState<Record<string, number>>({});

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

  const handleSelectAnswer = (qId: string, optionIdx: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleReset = () => {
    setAnswers({});
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
  const totalQuestions = MOCK_QUIZ.questions.length;
  const answeredCount = Object.keys(answers).length;

  const correctCount = useMemo(() => {
    return MOCK_QUIZ.questions.filter(
      (q) => answers[q.id] === q.correctOptionIndex,
    ).length;
  }, [answers]);

  const scorePercent =
    answeredCount > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans pb-24 selection:bg-primary/20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-2xs">
            <HelpCircle className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-foreground">
                Quiz Study Material Lab
              </h1>
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-mono uppercase px-2 py-0.5"
              >
                Prototype Route
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Testing 4 distinct layout & UX paradigms for interactive quiz study materials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5 cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            Reset Quiz
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
        {currentVariant === "A" && (
          <VariantA_InstantArcade
            quiz={MOCK_QUIZ}
            answers={answers}
            onSelectAnswer={handleSelectAnswer}
            onReset={handleReset}
            scorePercent={scorePercent}
            correctCount={correctCount}
            answeredCount={answeredCount}
            totalQuestions={totalQuestions}
          />
        )}

        {currentVariant === "B" && (
          <VariantB_ExamOverview
            quiz={MOCK_QUIZ}
            answers={answers}
            onSelectAnswer={handleSelectAnswer}
            onReset={handleReset}
            scorePercent={scorePercent}
            correctCount={correctCount}
            answeredCount={answeredCount}
            totalQuestions={totalQuestions}
          />
        )}

        {currentVariant === "C" && (
          <VariantC_StudioWorkbench
            quiz={MOCK_QUIZ}
            answers={answers}
            onSelectAnswer={handleSelectAnswer}
            onReset={handleReset}
            scorePercent={scorePercent}
            correctCount={correctCount}
            totalQuestions={totalQuestions}
          />
        )}

        {currentVariant === "D" && (
          <VariantD_SpeedSprint
            quiz={MOCK_QUIZ}
            answers={answers}
            onSelectAnswer={handleSelectAnswer}
            onReset={handleReset}
            scorePercent={scorePercent}
            correctCount={correctCount}
            totalQuestions={totalQuestions}
          />
        )}
      </main>

      {/* Floating Prototype Switcher */}
      <PrototypeSwitcher current={currentVariant} onChange={changeVariant} />
    </div>
  );
}

// ============================================================================
// Variant A: Instant Feedback Stepper / Arcade Card
// ============================================================================

function VariantA_InstantArcade({
  quiz,
  answers,
  onSelectAnswer,
  onReset,
  scorePercent,
  correctCount,
  totalQuestions,
}: {
  quiz: QuizData;
  answers: Record<string, number>;
  onSelectAnswer: (qId: string, optionIdx: number) => void;
  onReset: () => void;
  scorePercent: number;
  correctCount: number;
  answeredCount: number;
  totalQuestions: number;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const question = quiz.questions[currentIdx];
  const selectedIdx = answers[question.id];
  const isAnswered = selectedIdx !== undefined;
  const isCorrect = selectedIdx === question.correctOptionIndex;

  const isCompleted = Object.keys(answers).length === totalQuestions;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Progress Meter */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
              Instant Arcade Mode
            </Badge>
            <span className="text-xs font-mono font-semibold text-muted-foreground">
              Question {currentIdx + 1} of {totalQuestions}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-foreground">
            <Trophy className="size-4 text-amber-500" />
            <span>Score: {scorePercent}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm relative overflow-hidden">
        {/* Category Pill */}
        {question.category && (
          <span className="text-[11px] font-mono font-bold text-primary uppercase tracking-wider block">
            {question.category}
          </span>
        )}

        <h2 className="text-lg md:text-xl font-bold text-foreground leading-snug">
          {question.prompt}
        </h2>

        {/* Options Grid */}
        <div className="space-y-3">
          {question.options.map((opt, oi) => {
            const isSelected = selectedIdx === oi;
            const isCorrectOption = oi === question.correctOptionIndex;

            let style =
              "border-border/80 bg-background hover:bg-muted/40 text-foreground";
            let badgeStyle = "bg-muted text-muted-foreground border-border";

            if (isAnswered) {
              if (isCorrectOption) {
                style =
                  "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold";
                badgeStyle = "bg-emerald-500 text-white border-emerald-500";
              } else if (isSelected && !isCorrect) {
                style =
                  "border-destructive bg-destructive/10 text-destructive font-semibold";
                badgeStyle = "bg-destructive text-white border-destructive";
              } else {
                style = "border-border/40 opacity-50 text-muted-foreground";
              }
            }

            return (
              <button
                key={oi}
                type="button"
                onClick={() => {
                  onSelectAnswer(question.id, oi);
                  setShowExplanation(true);
                }}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group text-xs sm:text-sm",
                  style,
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={cn(
                      "size-7 rounded-xl font-mono font-bold text-xs flex items-center justify-center shrink-0 border transition-all",
                      badgeStyle,
                    )}
                  >
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <span className="leading-relaxed">{opt.text}</span>
                </div>

                {isAnswered && (
                  <div className="shrink-0">
                    {isCorrectOption ? (
                      <CheckCircle2 className="size-5 text-emerald-500" />
                    ) : (
                      isSelected && <XCircle className="size-5 text-destructive" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Instant Explanation Box */}
        {isAnswered && (
          <div
            className={cn(
              "p-4 rounded-2xl border text-xs space-y-1.5 animate-in slide-in-from-top-2 duration-200",
              isCorrect
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200",
            )}
          >
            <div className="flex items-center gap-2 font-bold font-mono uppercase text-[11px]">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="size-4 text-emerald-500" /> Correct Answer!
                </>
              ) : (
                <>
                  <AlertCircle className="size-4 text-amber-500" /> Explanation
                </>
              )}
            </div>
            <p className="leading-relaxed">
              {question.options[selectedIdx].explanation}
            </p>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            disabled={currentIdx === 0}
            onClick={() => {
              setCurrentIdx((prev) => prev - 1);
              setShowExplanation(false);
            }}
            className="h-9 rounded-xl text-xs gap-1 cursor-pointer"
          >
            <ChevronLeft className="size-4" /> Previous
          </Button>

          {currentIdx === totalQuestions - 1 ? (
            <Button
              size="sm"
              onClick={onReset}
              className="h-9 rounded-xl text-xs gap-1 cursor-pointer font-semibold"
            >
              <RotateCcw className="size-4" /> Retry Quiz
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                setCurrentIdx((prev) => prev + 1);
                setShowExplanation(false);
              }}
              className="h-9 rounded-xl text-xs gap-1 cursor-pointer font-semibold"
            >
              Next Question <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Variant B: Exam Overview / All-in-One Scantron View
// ============================================================================

function VariantB_ExamOverview({
  quiz,
  answers,
  onSelectAnswer,
  onReset,
  scorePercent,
  correctCount,
  answeredCount,
  totalQuestions,
}: {
  quiz: QuizData;
  answers: Record<string, number>;
  onSelectAnswer: (qId: string, optionIdx: number) => void;
  onReset: () => void;
  scorePercent: number;
  correctCount: number;
  answeredCount: number;
  totalQuestions: number;
}) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
      {/* Left Sidebar Navigator */}
      <div className="lg:col-span-4 bg-card border border-border rounded-3xl p-5 space-y-5 shadow-2xs sticky top-20">
        <div className="space-y-1">
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs">
            Exam Sheet Mode
          </Badge>
          <h2 className="text-base font-bold text-foreground">Scantron Overview</h2>
        </div>

        {/* Metrics Box */}
        <div className="bg-muted/40 border border-border/60 rounded-2xl p-4 space-y-2 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Answered:</span>
            <span className="font-bold text-foreground">{answeredCount} / {totalQuestions}</span>
          </div>
          {submitted && (
            <div className="flex justify-between border-t border-border/40 pt-2">
              <span className="text-muted-foreground">Final Score:</span>
              <span className="font-bold text-emerald-600">{scorePercent}% ({correctCount}/{totalQuestions})</span>
            </div>
          )}
        </div>

        {/* Question Quick Jump Matrix */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase">
            Question Jump Matrix
          </span>
          <div className="grid grid-cols-5 gap-2">
            {quiz.questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCorrect = answers[q.id] === q.correctOptionIndex;

              let style = "bg-background border-border text-muted-foreground";

              if (isAnswered) {
                if (submitted) {
                  style = isCorrect
                    ? "bg-emerald-500 text-white border-emerald-500 font-bold"
                    : "bg-destructive text-white border-destructive font-bold";
                } else {
                  style = "bg-primary text-primary-foreground border-primary font-bold";
                }
              }

              return (
                <a
                  key={q.id}
                  href={`#q-${q.id}`}
                  className={cn(
                    "size-9 rounded-xl border text-xs flex items-center justify-center font-mono transition-all hover:scale-105",
                    style,
                  )}
                >
                  Q{idx + 1}
                </a>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        {!submitted ? (
          <Button
            onClick={() => setSubmitted(true)}
            disabled={answeredCount === 0}
            className="w-full h-10 rounded-2xl font-semibold text-xs cursor-pointer shadow-md"
          >
            Submit & Grade Exam
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(false);
              onReset();
            }}
            className="w-full h-10 rounded-2xl font-semibold text-xs cursor-pointer"
          >
            <RotateCcw className="size-4 mr-1.5" /> Retake Exam
          </Button>
        )}
      </div>

      {/* Right List of Questions */}
      <div className="lg:col-span-8 space-y-6">
        {quiz.questions.map((q, qIdx) => {
          const selectedIdx = answers[q.id];

          return (
            <div
              id={`q-${q.id}`}
              key={q.id}
              className="bg-card border border-border/80 rounded-3xl p-6 space-y-4 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
                <span className="text-xs font-mono font-bold text-primary uppercase">
                  Question 0{qIdx + 1}
                </span>
                {q.category && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                    {q.category}
                  </Badge>
                )}
              </div>

              <h3 className="text-base font-bold text-foreground leading-snug">
                {q.prompt}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {q.options.map((opt, oi) => {
                  const isSelected = selectedIdx === oi;
                  const isCorrect = oi === q.correctOptionIndex;

                  let style = "border-border bg-background text-foreground hover:bg-muted/40";
                  if (isSelected) {
                    style = "border-primary bg-primary/10 text-primary font-semibold";
                  }

                  if (submitted) {
                    if (isCorrect) {
                      style = "border-emerald-500 bg-emerald-500/10 text-emerald-700 font-semibold";
                    } else if (isSelected && !isCorrect) {
                      style = "border-destructive bg-destructive/10 text-destructive font-semibold";
                    }
                  }

                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={submitted}
                      onClick={() => onSelectAnswer(q.id, oi)}
                      className={cn(
                        "p-3 rounded-2xl border text-xs text-left transition-all cursor-pointer flex items-center gap-2.5",
                        style,
                      )}
                    >
                      <span className="size-6 rounded-lg bg-muted text-muted-foreground flex items-center justify-center font-mono font-bold text-[10px] shrink-0 border">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="leading-tight">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {submitted && selectedIdx !== undefined && (
                <div className="bg-muted/40 border border-border/60 rounded-2xl p-3 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground block mb-0.5">Explanation:</span>
                  {q.options[selectedIdx].explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Variant C: Split-Pane Studio & Mastery Workbench
// ============================================================================

function VariantC_StudioWorkbench({
  quiz,
  answers,
  onSelectAnswer,
  onReset,
  scorePercent,
  correctCount,
  totalQuestions,
}: {
  quiz: QuizData;
  answers: Record<string, number>;
  onSelectAnswer: (qId: string, optionIdx: number) => void;
  onReset: () => void;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const q = quiz.questions[activeIdx];
  const selectedIdx = answers[q.id];
  const isAnswered = selectedIdx !== undefined;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-mono uppercase">Mastery Score</span>
          <p className="text-2xl font-extrabold text-foreground font-mono">{scorePercent}%</p>
          <span className="text-[11px] text-emerald-600 font-medium">
            {correctCount} correct answers
          </span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-mono uppercase">Answered</span>
          <p className="text-2xl font-extrabold text-primary font-mono">
            {Object.keys(answers).length} / {totalQuestions}
          </p>
          <span className="text-[11px] text-muted-foreground font-mono">Total questions</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-mono uppercase">Current Question</span>
          <p className="text-2xl font-extrabold text-indigo-500 font-mono">
            0{activeIdx + 1}
          </p>
          <span className="text-[11px] text-muted-foreground font-mono">Index</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-mono uppercase">Mode</span>
          <p className="text-xl font-extrabold text-purple-500 font-mono pt-0.5">
            Workbench
          </p>
          <span className="text-[11px] text-muted-foreground font-mono">Deep Review</span>
        </div>
      </div>

      {/* Split Pane: Question Tree on Left, Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigator List */}
        <div className="lg:col-span-5 bg-card border border-border rounded-3xl p-5 space-y-3 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
            Question Deck
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {quiz.questions.map((item, idx) => {
              const isSelected = idx === activeIdx;
              const hasAnswered = answers[item.id] !== undefined;

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveIdx(idx)}
                  className={cn(
                    "p-3 rounded-2xl border text-xs transition-all cursor-pointer flex items-center justify-between gap-3",
                    isSelected
                      ? "bg-primary/10 border-primary font-semibold text-foreground shadow-2xs"
                      : hasAnswered
                        ? "bg-muted/30 border-border/60 text-muted-foreground"
                        : "bg-background border-border/80 hover:bg-muted/40 text-foreground",
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="size-6 rounded-lg bg-muted text-muted-foreground font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{item.prompt}</span>
                  </div>

                  {hasAnswered && (
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Active Question Studio */}
        <div className="lg:col-span-7 bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <span className="text-xs font-mono font-bold text-primary uppercase">
              Question {activeIdx + 1} of {totalQuestions}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={activeIdx === 0}
                onClick={() => setActiveIdx((prev) => prev - 1)}
                className="h-8 rounded-xl text-xs gap-1 cursor-pointer"
              >
                <ChevronLeft className="size-3.5" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={activeIdx === totalQuestions - 1}
                onClick={() => setActiveIdx((prev) => prev + 1)}
                className="h-8 rounded-xl text-xs gap-1 cursor-pointer"
              >
                Next <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>

          <h2 className="text-lg md:text-xl font-bold text-foreground leading-snug">
            {q.prompt}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {q.options.map((opt, oi) => {
              const isSelected = selectedIdx === oi;
              const isCorrect = oi === q.correctOptionIndex;

              let style = "border-border bg-background hover:bg-muted/40 text-foreground";
              if (isSelected) {
                style = isCorrect
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 font-semibold"
                  : "border-destructive bg-destructive/10 text-destructive font-semibold";
              }

              return (
                <button
                  key={oi}
                  type="button"
                  onClick={() => onSelectAnswer(q.id, oi)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-3",
                    style,
                  )}
                >
                  <span className="size-7 rounded-xl bg-muted text-muted-foreground font-mono font-bold text-xs flex items-center justify-center shrink-0 border">
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <span className="leading-relaxed">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {isAnswered && (
            <div className="bg-muted/40 border border-border/60 rounded-2xl p-4 text-xs space-y-1">
              <span className="font-bold font-mono text-primary uppercase text-[10px]">
                Concept Breakdown
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {q.options[selectedIdx].explanation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Variant D: Speed Sprint / Time-Trial Challenge
// ============================================================================

function VariantD_SpeedSprint({
  quiz,
  answers,
  onSelectAnswer,
  onReset,
  scorePercent,
  correctCount,
  totalQuestions,
}: {
  quiz: QuizData;
  answers: Record<string, number>;
  onSelectAnswer: (qId: string, optionIdx: number) => void;
  onReset: () => void;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [streak, setStreak] = useState(2);
  const q = quiz.questions[currentIdx];
  const selectedIdx = answers[q.id];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Gamified Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs flex items-center gap-1 font-mono">
              <Flame className="size-3.5 fill-amber-500 text-amber-500" /> {streak}x Streak!
            </Badge>
            <span className="text-xs font-mono text-slate-400">Time Trial</span>
          </div>
          <h2 className="text-lg font-extrabold tracking-tight">Speed Challenge Mode</h2>
        </div>

        <div className="text-right font-mono">
          <span className="text-2xl font-black text-amber-400">{scorePercent}%</span>
          <span className="text-xs text-slate-400 block">{correctCount}/{totalQuestions} Correct</span>
        </div>
      </div>

      {/* Active Question Box */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-md">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>Question {currentIdx + 1} of {totalQuestions}</span>
          <span className="flex items-center gap-1 text-amber-500 font-bold">
            <Zap className="size-4" /> Fast Answer Bonus Active
          </span>
        </div>

        <h3 className="text-lg font-bold text-foreground leading-snug">
          {q.prompt}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {q.options.map((opt, oi) => {
            const isSelected = selectedIdx === oi;
            const isCorrect = oi === q.correctOptionIndex;

            let style = "border-border bg-background hover:border-primary/50 text-foreground";
            if (isSelected) {
              style = isCorrect
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 font-bold scale-[1.01]"
                : "border-destructive bg-destructive/10 text-destructive font-bold";
            }

            return (
              <button
                key={oi}
                type="button"
                onClick={() => {
                  onSelectAnswer(q.id, oi);
                  if (oi === q.correctOptionIndex) {
                    setStreak((prev) => prev + 1);
                  } else {
                    setStreak(0);
                  }
                }}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 shadow-2xs",
                  style,
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="size-7 rounded-xl bg-muted text-muted-foreground font-mono font-bold text-xs flex items-center justify-center shrink-0 border">
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <span>{opt.text}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((prev) => prev - 1)}
            className="h-9 rounded-xl text-xs gap-1 cursor-pointer"
          >
            <ChevronLeft className="size-4" /> Prev
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (currentIdx < totalQuestions - 1) {
                setCurrentIdx((prev) => prev + 1);
              } else {
                onReset();
              }
            }}
            className="h-9 rounded-xl text-xs gap-1 cursor-pointer font-semibold"
          >
            {currentIdx < totalQuestions - 1 ? (
              <>
                Next <ChevronRight className="size-4" />
              </>
            ) : (
              <>
                Finish & Restart <RotateCcw className="size-4" />
              </>
            )}
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
  { key: "A", label: "A — Instant Arcade", desc: "Interactive stepper with instant feedback" },
  { key: "B", label: "B — Exam Overview", desc: "All-in-one scantron sheet with quick jump matrix" },
  { key: "C", label: "C — Studio Workbench", desc: "Split-pane mastery review with tree navigator" },
  { key: "D", label: "D — Speed Sprint", desc: "Gamified streak-building fast challenge" },
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
                  ? "bg-amber-500 text-slate-950 shadow-sm scale-105"
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
