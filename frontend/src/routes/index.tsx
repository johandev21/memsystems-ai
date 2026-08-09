import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/shared/ui/logo";
import { authClient } from "@/shared/auth";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const benefits = [
  {
    label: "Keep the thread",
    title: "Your sources stay attached to the thinking.",
    body: "Bring papers, notes, links, and PDFs into one notebook so every answer has a place to point back to.",
  },
  {
    label: "Ask better questions",
    title: "Talk to the material, not a blank chat box.",
    body: "Memsystems uses the context you collected to help you compare ideas, find gaps, and move a question forward.",
  },
  {
    label: "Leave with something useful",
    title: "Turn a reading list into a study system.",
    body: "Generate flashcards, quizzes, roadmaps, and mind maps from the work you already did.",
  },
];

const faqs = [
  [
    "What is Memsystems?",
    "Memsystems is a research and study notebook that keeps your sources, notes, AI conversations, and study materials together.",
  ],
  [
    "Who is it for?",
    "It is built for students, independent researchers, and curious people who need to make sense of a body of material.",
  ],
  [
    "Can I use my own sources?",
    "Yes. Add the sources you are already using, then keep the resulting conversation and study materials in the same notebook.",
  ],
  [
    "Does it replace reading?",
    "No. It helps you read with more structure by making the relationships between your sources easier to inspect.",
  ],
  [
    "How do I start?",
    "Choose Start building your notebook, continue with Google, and create your first notebook from the home screen.",
  ],
  [
    "Can I cancel?",
    "There is no long term commitment to begin. You can leave whenever you want, and your work remains yours.",
  ],
];

function ArrowUpRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4">
      <path
        d="M3 13 13 3M5 3h8v8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LandingPage() {
  const { isPending } = authClient.useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const revealRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const node = revealRef.current;
    if (!node) return;
    const words = node.querySelectorAll<HTMLElement>("[data-reveal-word]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.active = "true";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.8, rootMargin: "0px 0px -12% 0px" },
    );
    words.forEach((word) => observer.observe(word));
    return () => observer.disconnect();
  }, []);

  if (isPending) {
    return <div className="min-h-screen bg-background" />;
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="relative z-20 px-4 pt-4 sm:px-6 sm:pt-6">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-border bg-card/90 px-4 py-3 backdrop-blur-xl sm:px-5"
          aria-label="Main navigation"
        >
          <a href="#top" className="flex items-center gap-2.5" onClick={closeMenu}>
            <Logo className="size-7 text-primary" />
            <span className="text-sm font-semibold tracking-[-0.02em]">Memsystems</span>
          </a>
          <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a
              href="#why"
              className="transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-foreground"
            >
              Why it works
            </a>
            <a
              href="#how"
              className="transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-foreground"
            >
              How it works
            </a>
            <a
              href="#faq"
              className="transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-foreground"
            >
              FAQ
            </a>
          </div>
          <Link
            to="/login"
            className="hidden rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-accent/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px md:inline-flex"
          >
            Start free
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="relative flex size-9 items-center justify-center rounded-full text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
          >
            <span
              className={`absolute h-px w-4 bg-current transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${menuOpen ? "rotate-45" : "-translate-y-1"}`}
            />
            <span
              className={`absolute h-px w-4 bg-current transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${menuOpen ? "-rotate-45" : "translate-y-1"}`}
            />
          </button>
        </nav>
        <div
          className={`fixed inset-0 -z-10 flex flex-col justify-center bg-background/95 px-8 backdrop-blur-3xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden ${menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <div className="flex flex-col gap-6 text-4xl font-semibold tracking-[-0.05em]">
            {[
              ["Why it works", "#why"],
              ["How it works", "#how"],
              ["FAQ", "#faq"],
            ].map(([label, href], index) => (
              <a
                key={label}
                href={href}
                onClick={closeMenu}
                className={`transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${menuOpen ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}
                style={{ transitionDelay: `${100 + index * 50}ms` }}
              >
                {label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={closeMenu}
              className={`mt-4 w-fit rounded-full bg-accent px-5 py-3 text-lg text-accent-foreground transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${menuOpen ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}
              style={{ transitionDelay: "250ms" }}
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section
          id="top"
          className="mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pb-28 sm:pt-28 lg:pb-32 lg:pt-36"
        >
          <div className="grid items-end gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <p className="mb-6 font-mono text-xs uppercase tracking-[0.18em] text-primary">
                A notebook for making sense of things
              </p>
              <h1 className="max-w-2xl text-5xl font-semibold leading-none tracking-[-0.06em] text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground text-balance sm:text-7xl">
                Think with your sources, not around them.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-7 text-muted-foreground text-pretty sm:text-xl">
                Memsystems brings research, notes, and AI into one quiet workspace so you can go
                from scattered reading to a point of view.
              </p>
              <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-base font-semibold text-accent-foreground transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:bg-accent/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
                >
                  Start building your notebook <ArrowUpRight />
                </Link>
                <span className="text-sm text-muted-foreground">
                  Free to begin. Continue with Google.
                </span>
              </div>
            </div>
            <WorkspacePreview />
          </div>
        </section>

        <section id="why" className="border-y border-border bg-card px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 flex flex-col gap-4 md:mb-16 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  The difference
                </p>
                <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl">
                  Make the work easier to return to.
                </h2>
              </div>
              <p className="max-w-sm text-base leading-6 text-muted-foreground text-pretty">
                A useful notebook does not just hold information. It gives the next thought
                somewhere to land.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
              {benefits.map((benefit) => (
                <article key={benefit.label} className="bg-card p-6 sm:p-8">
                  <p className="mb-16 font-mono text-xs uppercase tracking-[0.15em] text-primary">
                    {benefit.label}
                  </p>
                  <h3 className="mb-4 text-2xl font-semibold leading-tight tracking-[-0.04em] text-balance">
                    {benefit.title}
                  </h3>
                  <p className="text-base leading-6 text-muted-foreground text-pretty">
                    {benefit.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-36">
          <p
            ref={revealRef}
            className="max-w-4xl text-4xl font-semibold leading-tight tracking-[-0.06em] text-foreground/30 text-balance sm:text-6xl"
          >
            {"Good research is not more tabs. It is a clear path through what you already know."
              .split(" ")
              .map((word, index, words) => (
                <span
                  key={`${word}-${index}`}
                  className={`inline-block ${index < words.length - 1 ? "mr-[0.24em]" : ""}`}
                >
                  <span
                    data-reveal-word
                    className="transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  >
                    {word}
                  </span>
                </span>
              ))}
          </p>
        </section>

        <section
          id="how"
          className="border-y border-border bg-secondary px-4 py-20 text-secondary-foreground sm:px-6 sm:py-28"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 flex flex-col gap-4 md:mb-16 md:flex-row md:justify-between">
              <div>
                <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  A calmer workflow
                </p>
                <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl">
                  From first source to a study system.
                </h2>
              </div>
              <p className="max-w-sm text-base leading-6 text-muted-foreground text-pretty">
                Keep the messy middle. Memsystems helps you make it legible.
              </p>
            </div>
            <div className="grid gap-10 md:grid-cols-3">
              {[
                ["Collect", "Start a notebook and bring in the sources that shape your question."],
                [
                  "Connect",
                  "Ask questions with the material close by, and keep useful answers beside it.",
                ],
                [
                  "Remember",
                  "Turn the ideas into flashcards, quizzes, and maps you can return to.",
                ],
              ].map(([title, body], index) => (
                <article key={title} className="border-t border-secondary-foreground/20 pt-5">
                  <p className="mb-12 font-mono text-xs text-muted-foreground">0{index + 1}</p>
                  <h3 className="mb-3 text-2xl font-semibold tracking-[-0.04em]">{title}</h3>
                  <p className="max-w-xs text-base leading-6 text-muted-foreground text-pretty">
                    {body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:items-start">
            <div>
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-primary">
                Built for the long read
              </p>
              <h2 className="max-w-sm text-3xl font-semibold tracking-[-0.05em] text-balance sm:text-4xl">
                Your best ideas deserve better than a browser tab.
              </h2>
            </div>
            <blockquote className="border-l border-primary pl-6">
              <p className="max-w-2xl text-2xl leading-tight tracking-[-0.04em] text-balance sm:text-4xl">
                “I can finally see the argument I am building, not just the articles I have opened.”
              </p>
              <footer className="mt-6 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Maya Chen / graduate researcher
              </footer>
            </blockquote>
          </div>
        </section>

        <section id="faq" className="border-t border-border bg-card px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl">
            <div className="mb-10">
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Before you begin
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
                Questions worth answering.
              </h2>
            </div>
            <div className="divide-y divide-border">
              {faqs.map(([question, answer]) => (
                <details key={question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium tracking-[-0.02em] marker:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                    <span>{question}</span>
                    <span className="text-2xl font-light text-primary transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="max-w-2xl pt-4 text-base leading-6 text-muted-foreground text-pretty">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6 sm:py-36">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.18em] text-primary">
              Begin with one question
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.06em] text-balance sm:text-6xl">
              Make room for the thought after the thought.
            </h2>
            <Link
              to="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-base font-semibold text-accent-foreground transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:bg-accent/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
            >
              Start building your notebook <ArrowUpRight />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <a href="#top" className="flex items-center gap-2 text-foreground">
            <Logo className="size-5 text-primary" />
            <span className="font-semibold">Memsystems</span>
          </a>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="#privacy" className="transition-colors hover:text-foreground">
              Privacy
            </a>
            <a href="#terms" className="transition-colors hover:text-foreground">
              Terms
            </a>
            <span id="privacy">© 2026 Memsystems</span>
            <span id="terms">Built for better questions.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function WorkspacePreview() {
  return (
    <div
      aria-label="Preview of a Memsystems research notebook"
      className="relative min-h-[25rem] overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-2xl shadow-black/10 sm:min-h-[32rem] sm:p-4"
    >
      <div className="flex items-center justify-between border-b border-border px-2 pb-3 text-xs text-muted-foreground">
        <span className="font-mono uppercase tracking-[0.13em]">
          Notebook / memory and attention
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary" /> synced
        </span>
      </div>
      <div className="grid h-[21rem] grid-cols-[0.28fr_0.72fr] gap-3 pt-3 sm:h-[27rem]">
        <aside className="hidden border-r border-border pr-3 sm:block">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Sources 08
          </p>
          <div className="space-y-3 text-xs text-muted-foreground">
            <p className="border-l-2 border-primary pl-2 text-foreground">The extended mind</p>
            <p>Attention and memory</p>
            <p>Designing for recall</p>
            <p>Notes from seminar</p>
            <p>Open questions</p>
          </div>
        </aside>
        <div className="flex min-w-0 flex-col rounded-xl bg-muted p-4 sm:p-6">
          <div className="mb-8">
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-primary">
              Working note
            </p>
            <h3 className="max-w-md text-xl font-semibold leading-tight tracking-[-0.04em] sm:text-3xl">
              What changes when memory has a place to go?
            </h3>
          </div>
          <div className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              Externalizing a thought is not the same as losing it. The notebook becomes a second
              surface for the work.
            </p>
            <p className="rounded-lg bg-secondary p-3 text-secondary-foreground">
              A useful system should make return easier, not ask you to remember where you left off.
            </p>
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-border pt-3 font-mono text-xs text-muted-foreground">
            <span>3 sources attached</span>
            <span className="text-primary">Ask notebook ↗</span>
          </div>
        </div>
      </div>
    </div>
  );
}
