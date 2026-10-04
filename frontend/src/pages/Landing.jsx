import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Brain,
  ChevronRight,
  FileText,
  GraduationCap,
  Menu,
  MessageCircle,
  Search,
  Shield,
  Upload,
  X,
  Zap,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { DocuMindLogo } from "@/components/ui/DocuMindLogo";

const features = [
  {
    icon: MessageCircle,
    title: "Cite-Grounded Answers",
    description:
      "Every response links back to exact page numbers in your document. Grounded facts with zero guesswork.",
    tag: "Verified citations",
  },
  {
    icon: GraduationCap,
    title: "Practice Exam Studio",
    description:
      "Turn any uploaded textbook or notes into a scored multiple-choice exam with instant grading and explanations.",
    tag: "Instant feedback",
  },
  {
    icon: FileText,
    title: "Executive Summaries",
    description:
      "Condense 100-page complex reports into clear, structured takeaways and key findings in seconds.",
    tag: "High efficiency",
  },
  {
    icon: Brain,
    title: "Multi-Document Synthesis",
    description:
      "Cross-reference and analyze multiple PDFs simultaneously in a unified knowledge conversation.",
    tag: "Unified context",
  },
  {
    icon: Shield,
    title: "Document-Grounded Control",
    description:
      "Toggle between Strict Document-Only and Moderate modes to match your exact study requirements.",
    tag: "Full control",
  },
  {
    icon: BarChart3,
    title: "Performance Tracking",
    description:
      "Review attempt histories, identify knowledge gaps, and track topic mastery over time.",
    tag: "Analytics",
  },
];

const steps = [
  {
    step: "01",
    title: "Upload Documents",
    description:
      "Drop any PDF, TXT, or Markdown file into your workspace. DocuMind indexes every page instantly.",
    icon: Upload,
  },
  {
    step: "02",
    title: "Ask & Cross-Examine",
    description:
      "Inquire in plain language. Receive precise, structured answers with verified page reference badges.",
    icon: Search,
  },
  {
    step: "03",
    title: "Practice & Master",
    description:
      "Generate tailored practice quizzes, study with interactive flashcards, and ace your exams.",
    icon: GraduationCap,
  },
];

const stats = [
  { label: "Documents Processed", value: "10K+", suffix: "" },
  { label: "Practice Questions", value: "50K+", suffix: "" },
  { label: "Citation Accuracy", value: "99.4", suffix: "%" },
  { label: "Active Researchers", value: "2K+", suffix: "" },
];

export const Landing = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="min-h-dvh overflow-x-hidden bg-white text-slate-900 font-sans">
      {/* ── Top Navigation ────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
          scrolled
            ? "border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs"
            : "bg-white/80 backdrop-blur-xs border-b border-slate-100"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2">
            <DocuMindLogo size="sm" withText={true} subtitle="Workspace" forceLight={true} />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="transition-colors hover:text-slate-900">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-slate-900">
              How it works
            </a>
            <Link to="/login" className="transition-colors hover:text-slate-900">
              Sign in
            </Link>
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="rounded-xl bg-slate-900 px-4.5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.98]"
            >
              Get started
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg border border-slate-200 p-2 text-slate-700 md:hidden hover:bg-slate-50"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-5 pb-5 md:hidden shadow-lg animate-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col gap-1.5 pt-3 text-sm font-medium">
              <a
                href="#features"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                How it works
              </a>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="mt-2 rounded-xl bg-slate-900 px-4 py-2.5 text-center font-semibold text-white"
              >
                Get started free
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center px-5 pt-32 pb-20 text-center sm:pt-40 sm:pb-28 bg-gradient-to-b from-slate-50 via-white to-slate-50/40 border-b border-slate-100">
        {/* Crisp Enterprise Pill */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 shadow-2xs">
          <span className="flex size-2 rounded-full bg-emerald-500" />
          <span>Intelligent Document Workspace & Exam Practice</span>
          <ChevronRight className="size-3.5 text-slate-400" />
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
          Understand every document.
          <br />
          <span className="text-slate-600 font-bold">Research. Practice. Master.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Upload any PDF or research document. Query complex topics with cited, page-grounded
          accuracy, and auto-generate practice exams in seconds.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3.5 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-7 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.98]"
          >
            Start free workspace
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <a
            href="#features"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
          >
            Explore features
          </a>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">✓ No credit card required</span>
          <span className="flex items-center gap-1.5">✓ Works with any PDF, TXT & MD</span>
          <span className="flex items-center gap-1.5">✓ 100% cited source grounding</span>
        </div>

        {/* ── Product Workspace Mockup ──────────────────────────────────── */}
        <div className="relative mt-14 w-full max-w-4xl px-2">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-200/50">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-6 text-left">
              {/* Window Chrome */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="size-3 rounded-full bg-slate-300" />
                  <span className="size-3 rounded-full bg-slate-300" />
                  <span className="size-3 rounded-full bg-slate-300" />
                  <span className="ml-2 min-w-0 truncate font-mono text-[11px] text-slate-500 font-medium">
                    biology_lecture_notes_ch4.pdf
                  </span>
                </div>
                <span className="shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Indexed & Verified
                </span>
              </div>

              {/* Chat / Workspace Preview */}
              <div className="space-y-4">
                <div className="ml-auto max-w-[85%] sm:max-w-[70%] rounded-xl bg-slate-900 text-white px-4 py-3 text-sm font-medium">
                  What is the role of ATP synthase in oxidative phosphorylation?
                </div>

                <div className="max-w-[95%] sm:max-w-[85%] rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900">DocuMind Grounded Analysis</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      Page 12 · Section 4.2
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-slate-700">
                    ATP synthase utilizes the proton gradient across the inner mitochondrial membrane
                    to catalyze the synthesis of ATP from ADP and inorganic phosphate via rotational catalysis.
                  </p>
                  <div className="mt-3 flex flex-col items-start gap-2 border-t border-slate-100 pt-2.5 sm:flex-row sm:items-center">
                    <span className="text-[11px] text-slate-500 font-medium">Exact Evidence:</span>
                    <span className="max-w-full break-words rounded border border-blue-200/60 bg-blue-50 px-2 py-0.5 text-[11px] font-mono font-medium text-blue-700">
                      “Proton-motive force drives the rotor ring…” (p. 12)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Metrics Bar ───────────────────────────────────────────── */}
      <section className="border-b border-slate-100 bg-slate-50/60 py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-5 sm:grid-cols-4 sm:px-8">
          {stats.map(({ label, value, suffix }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                {value}
                <span className="text-slate-500">{suffix}</span>
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500 uppercase tracking-wide">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-5 sm:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Capabilities
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Engineered for rigorous study and research
            </h2>
            <p className="mx-auto mt-3.5 max-w-xl text-sm leading-6 text-slate-600">
              Every feature is built around grounding answers in your authentic documents.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description, tag }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-900 border border-slate-200/60">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow Steps ────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="border-t border-slate-100 bg-slate-50/70 py-24 px-5 sm:px-8"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Workflow
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              From raw document to deep mastery
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map(({ step, title, description, icon: Icon }) => (
              <div
                key={step}
                className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col items-start"
              >
                <div className="mb-4 flex items-center justify-between w-full">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-900 border border-slate-200/60">
                    <Icon className="size-4.5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-400">{step}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Executive CTA Section ─────────────────────────────────────── */}
      <section className="py-20 px-5 sm:px-8 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-4xl rounded-3xl bg-slate-900 text-white p-10 sm:p-14 text-center shadow-lg">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
            Ready to master your documents?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-300">
            Join thousands of students and researchers turning dense materials
            into clear, actionable understanding.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-7 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 active:scale-[0.98]"
            >
              Create free account
              <ArrowRight className="size-4" />
            </button>
            <Link
              to="/login"
              className="inline-flex h-11 items-center px-5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign in to existing account →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <DocuMindLogo size="xs" withText={true} subtitle="Platform" forceLight={true} />
          <p className="text-xs text-slate-500 font-medium">
            © {new Date().getFullYear()} DocuMind. High-integrity document research.
          </p>
          <div className="flex gap-5 text-xs text-slate-600 font-medium">
            <Link to="/login" className="hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="hover:text-slate-900 transition-colors">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
};