import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  FileText,
  CheckCircle2,
  Circle,
  RotateCcw,
  List,
  Clock,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Building2,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

export const Route = createFileRoute("/prototype/report")({
  component: PrototypeReportPage,
});

// ============================================================================
// Comprehensive Mock Report Data
// ============================================================================

interface ReportSection {
  id: string;
  heading: string;
  body: string;
  keyTakeaway?: string;
}

interface ReportData {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  date: string;
  organization: string;
  summary: string;
  sections: ReportSection[];
}

const MOCK_REPORT: ReportData = {
  id: "report-ai-memory-systems-2026",
  title: "Architectural Foundations of Episodic Memory in Autonomous Agent Systems",
  subtitle: "A Technical Evaluation of Hybrid Vector Retrieval, Graph Relationships, and Long-Term Retention Strategies",
  author: "Johan & Research Team",
  date: "July 2026",
  organization: "MemSystems AI Labs",
  summary:
    "Autonomous AI agents require robust memory models to maintain state consistency across extended interaction turns. This paper presents a comparative analysis of episodic vector retrieval vs structured knowledge graph storage, proposing a unified hybrid memory layer that achieves 40% higher precision and 3x faster context synthesis.",
  sections: [
    {
      id: "sec-1",
      heading: "1. Executive Summary & Problem Formulation",
      body: "Current Large Language Models (LLMs) operate under strict context window limits. While recent advances have expanded context windows to 1M+ tokens, processing entire conversation histories introduces extreme latency, quadratic attention compute costs, and performance degradation known as the 'lost-in-the-middle' phenomenon.\n\nTo solve this, modern production AI applications deploy decoupled memory subsystems. These subsystems store turn-by-turn user messages, extract semantic concepts, and dynamically inject only the most relevant historical memories back into the prompt context.",
      keyTakeaway: "Decoupled memory subsystems reduce token budget waste by 65% while eliminating context degradation.",
    },
    {
      id: "sec-2",
      heading: "2. Comparative Analysis: Vector Search vs Knowledge Graphs",
      body: "Dense vector embeddings (e.g. OpenAI text-embedding-3 or Voyage AI) excel at fuzzy semantic matching and conceptual similarity. However, vector distance search struggles with explicit relational queries such as 'Who was the manager of Project X in Q2?'\n\nConversely, Knowledge Graphs (KGs) represent entities as nodes and relationships as typed directed edges. A hybrid approach—combining vector dense search for semantic broad matching with graph traversal for multi-hop relation lookup—achieves superior retrieval quality across diverse user queries.",
      keyTakeaway: "Hybrid retrieval (Vector + Graph) yields optimal performance across both semantic and explicit entity lookup.",
    },
    {
      id: "sec-3",
      heading: "3. Implementation & System Integration Architecture",
      body: "Our system architecture comprises three distinct layers:\n\n1. Ingestion Pipeline: Chunks incoming user interactions and streams them to asynchronous processing queues.\n2. Normalization & Storage Layer: Generates 1536-dimensional embeddings stored in PGVector while extracting graph triples into Postgres adjacency tables.\n3. Context Synthesis Engine: Intercepts user requests, executes parallel hybrid retrieval, and applies cross-encoder re-ranking before context injection.",
      keyTakeaway: "Decoupling ingestion, vector storage, and synthesis ensures sub-100ms context injection latencies.",
    },
    {
      id: "sec-4",
      heading: "4. Empirical Evaluation & Benchmark Results",
      body: "Benchmarking against standard baseline memory retrieval shows a 42% reduction in hallucination rates during long-horizon conversational tasks. Response times maintained a mean p95 of 84ms under heavy multi-tenant workloads.\n\nFuture work will explore automatic memory pruning strategies based on Ebbinghaus forgetting curves to automatically decay transient noise while preserving core user domain knowledge.",
      keyTakeaway: "Memory pruning based on decay algorithms will further optimize storage density in production.",
    },
  ],
};

// ============================================================================
// Main Prototype Page Component
// ============================================================================

export function PrototypeReportPage() {
  const [currentVariant, setCurrentVariant] = useState<"A" | "B" | "C" | "D">("A");
  const [readSections, setReadSections] = useState<Record<string, boolean>>({
    "sec-1": true,
  });

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

  const toggleSectionRead = (id: string) => {
    setReadSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReset = () => {
    setReadSections({});
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

  const totalSections = MOCK_REPORT.sections.length;
  const readCount = useMemo(() => {
    return MOCK_REPORT.sections.filter((s) => readSections[s.id]).length;
  }, [readSections]);

  const progressPercent = Math.round((readCount / totalSections) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans pb-24 selection:bg-primary/20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20 shadow-2xs">
            <FileText className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-foreground">
                Report Document Studio Lab
              </h1>
              <Badge
                variant="outline"
                className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] font-mono uppercase px-2 py-0.5"
              >
                Prototype Route
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Testing 4 distinct document & paper layout paradigms (Google Docs, Published Journal, Notebook, Paginated).
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
            Reset Reading Progress
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
        {currentVariant === "A" && (
          <VariantA_GoogleDocsCanvas
            report={MOCK_REPORT}
            readSections={readSections}
            onToggleRead={toggleSectionRead}
            progressPercent={progressPercent}
            readCount={readCount}
            totalSections={totalSections}
          />
        )}

        {currentVariant === "B" && (
          <VariantB_ExecutiveJournal
            report={MOCK_REPORT}
            readSections={readSections}
            onToggleRead={toggleSectionRead}
            progressPercent={progressPercent}
            readCount={readCount}
            totalSections={totalSections}
          />
        )}

        {currentVariant === "C" && (
          <VariantC_NotionNotebook
            report={MOCK_REPORT}
            readSections={readSections}
            onToggleRead={toggleSectionRead}
            progressPercent={progressPercent}
            readCount={readCount}
            totalSections={totalSections}
          />
        )}

        {currentVariant === "D" && (
          <VariantD_PaginatedReader
            report={MOCK_REPORT}
            readSections={readSections}
            onToggleRead={toggleSectionRead}
            progressPercent={progressPercent}
            readCount={readCount}
            totalSections={totalSections}
          />
        )}
      </main>

      {/* Floating Prototype Switcher */}
      <PrototypeSwitcher current={currentVariant} onChange={changeVariant} />
    </div>
  );
}

// ============================================================================
// Variant A: Google Docs / Word Document Canvas
// ============================================================================

function VariantA_GoogleDocsCanvas({
  report,
  readSections,
  onToggleRead,
  progressPercent,
  readCount,
  totalSections,
}: {
  report: ReportData;
  readSections: Record<string, boolean>;
  onToggleRead: (id: string) => void;
  progressPercent: number;
  readCount: number;
  totalSections: number;
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Google Docs Application Bar */}
      <div className="bg-card border border-border/80 rounded-2xl p-3 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              DOC
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground leading-tight">
                {report.title}
              </h2>
              <span className="text-[11px] text-muted-foreground flex items-center gap-2 font-mono">
                <span>File: {report.id}.docx</span>
                <span>•</span>
                <span>Last edited 2 mins ago</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs font-mono">
              Google Docs View
            </Badge>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 cursor-pointer">
              <Printer className="size-3.5" /> Print
            </Button>
            <Button size="sm" className="h-8 text-xs gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium">
              <Download className="size-3.5" /> Export PDF
            </Button>
          </div>
        </div>

        {/* Word Formatting Toolbar Simulator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted/40 p-1.5 rounded-xl overflow-x-auto">
          <span className="bg-background px-2.5 py-1 rounded-md text-foreground font-medium border border-border/60">
            Arial (Normal Text)
          </span>
          <span className="bg-background px-2.5 py-1 rounded-md text-foreground font-medium border border-border/60">
            100% Zoom
          </span>
          <div className="h-4 w-px bg-border mx-1" />
          <button className="px-2 py-1 hover:bg-background rounded font-bold text-foreground">B</button>
          <button className="px-2 py-1 hover:bg-background rounded italic text-foreground">I</button>
          <button className="px-2 py-1 hover:bg-background rounded underline text-foreground">U</button>
          <div className="h-4 w-px bg-border mx-1" />
          <span className="ml-auto font-mono text-[11px] text-primary font-bold">
            Read: {readCount}/{totalSections} sections ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Main Document Layout with Outline Sidebar & Paper Page */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Document Outline Left Sidebar */}
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-4 space-y-3 shadow-2xs sticky top-20">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
            <List className="size-3.5 text-blue-600" /> Document Outline
          </h3>

          <div className="space-y-1.5 text-xs">
            <a href="#summary" className="block p-2 rounded-lg font-medium text-foreground hover:bg-muted">
              Executive Summary
            </a>
            {report.sections.map((s, idx) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={cn(
                  "block p-2 rounded-lg transition-colors flex items-center justify-between",
                  readSections[s.id]
                    ? "text-muted-foreground hover:bg-muted"
                    : "text-foreground font-medium hover:bg-muted",
                )}
              >
                <span className="truncate">Section {idx + 1}</span>
                {readSections[s.id] && <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />}
              </a>
            ))}
          </div>
        </div>

        {/* 8.5x11 Paper Canvas Container */}
        <div className="lg:col-span-9 bg-slate-200/60 dark:bg-slate-900/60 p-4 md:p-8 rounded-3xl border border-border/80 space-y-6">
          {/* Simulated White Paper Page */}
          <div className="bg-card text-foreground rounded-xl border border-border shadow-xl p-8 md:p-14 max-w-4xl mx-auto space-y-8 font-serif">
            {/* Header Metadata */}
            <div className="border-b border-border/80 pb-6 space-y-3 font-sans">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span>{report.organization}</span>
                <span>{report.date}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight font-serif">
                {report.title}
              </h1>
              <p className="text-sm text-muted-foreground italic font-serif">
                {report.subtitle}
              </p>
              <div className="text-xs font-mono text-muted-foreground pt-1">
                Author: <span className="font-semibold text-foreground">{report.author}</span>
              </div>
            </div>

            {/* Executive Summary Block */}
            <div id="summary" className="bg-muted/30 border-l-4 border-blue-600 p-5 rounded-r-xl space-y-2 font-sans">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
                Executive Summary
              </h3>
              <p className="text-sm leading-relaxed text-foreground/90 font-serif">
                {report.summary}
              </p>
            </div>

            {/* Report Sections */}
            <div className="space-y-10">
              {report.sections.map((s, idx) => (
                <div key={s.id} id={s.id} className="space-y-4 scroll-mt-24">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <h2 className="text-lg font-bold text-foreground tracking-tight font-sans">
                      {s.heading}
                    </h2>
                    <Button
                      size="sm"
                      variant={readSections[s.id] ? "outline" : "default"}
                      onClick={() => onToggleRead(s.id)}
                      className="h-7 rounded-lg text-xs font-sans gap-1 cursor-pointer"
                    >
                      {readSections[s.id] ? (
                        <>
                          <CheckCircle2 className="size-3 text-emerald-500" /> Read
                        </>
                      ) : (
                        "Mark Read"
                      )}
                    </Button>
                  </div>

                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-serif">
                    {s.body}
                  </p>

                  {s.keyTakeaway && (
                    <div className="bg-blue-500/5 border border-blue-500/20 p-3.5 rounded-xl font-sans text-xs text-blue-950 dark:text-blue-200">
                      <span className="font-bold text-blue-600 block mb-0.5 font-mono text-[10px] uppercase">
                        Key Finding
                      </span>
                      {s.keyTakeaway}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Page Footer */}
            <div className="border-t border-border/80 pt-6 text-center text-xs text-muted-foreground font-mono font-sans">
              Page 1 of 1 • {report.organization} • Confidential Research
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Variant B: Executive Briefing & Published Manuscript
// ============================================================================

function VariantB_ExecutiveJournal({
  report,
  readSections,
  onToggleRead,
  progressPercent,
  readCount,
  totalSections,
}: {
  report: ReportData;
  readSections: Record<string, boolean>;
  onToggleRead: (id: string) => void;
  progressPercent: number;
  readCount: number;
  totalSections: number;
}) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Published Journal Masthead */}
      <div className="bg-card border border-border rounded-3xl p-8 md:p-12 space-y-6 shadow-sm relative overflow-hidden">
        <div className="border-b-2 border-primary pb-4 flex items-center justify-between">
          <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase flex items-center gap-2">
            <Building2 className="size-4" /> {report.organization} • Research Publication
          </span>
          <span className="text-xs font-mono text-muted-foreground">{report.date}</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight tracking-tight">
            {report.title}
          </h1>
          <p className="text-base text-muted-foreground font-serif leading-relaxed italic">
            {report.subtitle}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-4 border-t border-border/60">
          <span>Author: <strong className="text-foreground">{report.author}</strong></span>
          <span>Reading Status: <strong className="text-primary">{readCount}/{totalSections} Sections Read ({progressPercent}%)</strong></span>
        </div>
      </div>

      {/* Abstract Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/5 border border-primary/20 rounded-2xl p-6 space-y-2">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary block">
          Abstract / Executive Summary
        </span>
        <p className="text-base font-serif leading-relaxed text-foreground/90 italic">
          "{report.summary}"
        </p>
      </div>

      {/* Report Content Sections */}
      <div className="space-y-8">
        {report.sections.map((s, idx) => (
          <div
            key={s.id}
            className={cn(
              "bg-card border rounded-3xl p-6 md:p-8 space-y-4 transition-all duration-200 shadow-2xs",
              readSections[s.id] ? "border-emerald-500/30 bg-muted/20" : "border-border",
            )}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <span className="text-xs font-mono font-bold text-primary uppercase">
                Section 0{idx + 1}
              </span>
              <button
                onClick={() => onToggleRead(s.id)}
                className="text-xs font-mono flex items-center gap-1.5 text-muted-foreground hover:text-primary cursor-pointer"
              >
                {readSections[s.id] ? (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-500" /> Completed
                  </>
                ) : (
                  <>
                    <Circle className="size-4" /> Mark Read
                  </>
                )}
              </button>
            </div>

            <h2 className="text-xl font-bold font-serif text-foreground tracking-tight">
              {s.heading}
            </h2>

            <p className="text-base font-serif leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {s.body}
            </p>

            {s.keyTakeaway && (
              <div className="mt-4 p-4 rounded-2xl bg-muted/50 border border-border/60 text-xs font-serif italic text-muted-foreground border-l-4 border-l-primary">
                <span className="font-bold text-foreground font-sans not-italic block mb-0.5 text-[10px] uppercase">
                  Takeaway
                </span>
                "{s.keyTakeaway}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Variant C: Digital Workspace & Notion-Style Reader
// ============================================================================

function VariantC_NotionNotebook({
  report,
  readSections,
  onToggleRead,
  progressPercent,
  readCount,
  totalSections,
}: {
  report: ReportData;
  readSections: Record<string, boolean>;
  onToggleRead: (id: string) => void;
  progressPercent: number;
  readCount: number;
  totalSections: number;
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Cover Banner */}
      <div className="h-40 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 flex items-end shadow-md">
        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md text-xs font-mono">
          Interactive Notion Reader
        </Badge>
      </div>

      {/* Header Info */}
      <div className="space-y-3 px-2">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          {report.title}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {report.summary}
        </p>

        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground pt-2 border-b border-border/60 pb-4">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" /> Read: {progressPercent}%
          </span>
          <span>•</span>
          <span>{readCount} of {totalSections} Sections Read</span>
        </div>
      </div>

      {/* Sections Accordion / Cards */}
      <div className="space-y-4">
        {report.sections.map((s, idx) => (
          <div
            key={s.id}
            className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-2xs hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-primary uppercase">
                0{idx + 1}. {s.heading}
              </span>
              <button
                onClick={() => onToggleRead(s.id)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
              >
                {readSections[s.id] ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : (
                  <Circle className="size-4" />
                )}
              </button>
            </div>

            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Variant D: Paginated Reader & Side-by-Side Inspector
// ============================================================================

function VariantD_PaginatedReader({
  report,
  readSections,
  onToggleRead,
  progressPercent,
  readCount,
  totalSections,
}: {
  report: ReportData;
  readSections: Record<string, boolean>;
  onToggleRead: (id: string) => void;
  progressPercent: number;
  readCount: number;
  totalSections: number;
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const currentSection = report.sections[currentPage];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Pagination Control */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-2xs">
        <div className="space-y-0.5">
          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-xs font-mono">
            Paginated Reader View
          </Badge>
          <span className="text-xs text-muted-foreground block font-mono">
            Page {currentPage + 1} of {totalSections}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="h-8 rounded-xl text-xs gap-1 cursor-pointer"
          >
            <ChevronLeft className="size-4" /> Prev Page
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalSections - 1}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="h-8 rounded-xl text-xs gap-1 cursor-pointer"
          >
            Next Page <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Active Page Sheet */}
      <div className="bg-card border border-border rounded-3xl p-8 md:p-12 space-y-6 shadow-md">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <span className="text-xs font-mono font-bold text-primary uppercase">
            {currentSection.heading}
          </span>
          <Button
            size="sm"
            variant={readSections[currentSection.id] ? "outline" : "default"}
            onClick={() => onToggleRead(currentSection.id)}
            className="h-8 rounded-xl text-xs gap-1 cursor-pointer"
          >
            {readSections[currentSection.id] ? (
              <>
                <CheckCircle2 className="size-3.5 text-emerald-500" /> Read
              </>
            ) : (
              "Mark as Read"
            )}
          </Button>
        </div>

        <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap font-serif">
          {currentSection.body}
        </p>

        {currentSection.keyTakeaway && (
          <div className="bg-muted/40 p-4 rounded-2xl border border-border/50 text-xs text-muted-foreground font-mono">
            <strong className="text-primary uppercase text-[10px] block mb-1">Key Takeaway</strong>
            {currentSection.keyTakeaway}
          </div>
        )}
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
  { key: "A", label: "A — Google Docs", desc: "Classic 8.5x11 white paper sheet with editor toolbar" },
  { key: "B", label: "B — Executive Journal", desc: "Published manuscript style with serif typography" },
  { key: "C", label: "C — Notion Notebook", desc: "Digital notebook layout with card sections" },
  { key: "D", label: "D — Paginated Reader", desc: "Page-by-page document reader view" },
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
                  ? "bg-blue-600 text-white shadow-sm scale-105"
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
