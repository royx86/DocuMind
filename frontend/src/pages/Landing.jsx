import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Menu,
  MessageCircle,
  Sparkles,
  X,
} from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Ask anything",
    description: "Get clear answers grounded in your documents.",
  },
  {
    icon: FileText,
    title: "Summarize faster",
    description: "Turn long PDFs into focused takeaways.",
  },
  {
    icon: BookOpen,
    title: "Study smarter",
    description: "Practice with instant AI-generated quizzes.",
  },
];

export const Landing = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-dvh overflow-hidden bg-[#080512] text-white">
      <div className="relative mx-auto min-h-dvh w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-3xl" />

        <header className="relative z-10 flex h-20 items-center justify-between border-b border-white/10">
          <Link to="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500 text-white shadow-lg shadow-violet-900/40">
              <Sparkles className="size-4" />
            </span>
            DocuMind
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-slate-400 md:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#workflow" className="transition-colors hover:text-white">How it works</a>
            <Link to="/login" className="text-white transition-colors hover:text-violet-300">Log in</Link>
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="rounded-full border border-violet-400/40 bg-violet-600 px-4 py-2 font-medium text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
            >
              Get started
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-full border border-white/10 p-2.5 text-slate-300 md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </header>

        {menuOpen && (
          <nav className="relative z-20 flex flex-col gap-1 border-b border-white/10 py-3 text-sm text-slate-300 md:hidden">
            <a href="#features" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-white/5">Features</a>
            <a href="#workflow" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-white/5">How it works</a>
            <Link to="/login" className="rounded-lg px-3 py-2 hover:bg-white/5">Log in</Link>
            <Link to="/register" className="mt-1 rounded-lg bg-violet-600 px-3 py-2 text-center font-medium text-white">Get started</Link>
          </nav>
        )}

        <section className="relative z-10 flex flex-col items-center pb-16 pt-20 text-center sm:pt-28 lg:pb-24">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-100">
            <span className="rounded-full bg-violet-400 px-1.5 py-0.5 text-[10px] font-semibold text-white">New</span>
            AI document intelligence
            <ArrowRight className="size-3.5" />
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl">
            Understand every document.
            <span className="block text-violet-300">Instantly.</span>
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
            Ask questions, summarize reports, and turn complex files into clear next steps with DocuMind.
          </p>
          <div className="mt-8 flex flex-col items-center gap-5 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="inline-flex h-12 items-center justify-center rounded-full bg-violet-600 px-7 text-sm font-semibold text-white shadow-xl shadow-violet-950/40 transition hover:-translate-y-0.5 hover:bg-violet-500"
            >
              Get started free
              <ArrowRight className="ml-2 size-4" />
            </button>
            <a href="#features" className="text-sm text-slate-400 transition hover:text-white">
              Explore features <ArrowRight className="ml-1 inline size-3.5" />
            </a>
          </div>
        </section>

        <section id="features" className="relative z-10 border-t border-white/10 py-8">
          <p className="mb-4 text-center text-xs text-slate-500">Built for focused work</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-violet-400/30 hover:bg-violet-500/[0.07]">
                <Icon className="mb-4 size-4 text-violet-400" />
                <h2 className="text-sm font-medium text-white">{title}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="relative z-10 grid gap-8 border-t border-white/10 py-16 md:grid-cols-2 md:items-center lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Your documents, understood</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">From upload to insight in minutes.</h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400">DocuMind keeps your files, cited answers, and practice quizzes together in one calm workspace.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300"><FileText className="size-4" /></div>
              <div className="text-left"><p className="text-sm font-medium">Your study workspace</p><p className="text-xs text-slate-500">Answers linked to source pages</p></div>
            </div>
            <div className="mt-5 space-y-3 text-left text-sm text-slate-300">
              <div className="rounded-lg bg-black/20 px-3 py-2.5">Summarize the key ideas in this chapter</div>
              <div className="ml-6 rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-2.5 text-violet-100">Here are the main ideas, with sources from pages 4-7.</div>
            </div>
          </div>
        </section>

        <footer className="relative z-10 border-t border-white/10 py-6 text-center text-xs text-slate-500">
          Make every document more useful.
        </footer>
      </div>
    </main>
  );
};