import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  LockKeyhole,
  Mail,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { DocuMindLogo } from "@/components/ui/DocuMindLogo";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

const HIGHLIGHTS = [
  "Answers grounded in your documents with page citations",
  "Tailored practice quizzes with instant scoring",
  "Multi-document cross-analysis in one workspace",
  "Strict vs Moderate modes for customized study control",
];

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { error, success } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    try {
      await login(email, password);
      success("Welcome back to DocuMind!");
      navigate("/dashboard");
    } catch (err) {
      setErrorMessage(err.message || "Invalid email or password");
      error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-white text-slate-900 flex">
      {/* ── Left panel (decorative overview) ── */}
      <aside className="relative hidden overflow-hidden lg:flex lg:w-[48%] flex-col justify-between p-12 xl:p-16 bg-slate-50 border-r border-slate-200/80">
        {/* Logo */}
        <div className="relative z-10 flex items-center">
          <DocuMindLogo size="md" withText={true} subtitle="Workspace" />
        </div>

        {/* Middle content */}
        <div className="relative z-10 max-w-sm">
          {/* Document Citation Card */}
          <div className="mb-10 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center">
                  <FileText className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Research_Paper_Draft.pdf</p>
                  <p className="text-[10px] text-slate-500">18 pages · Verified</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                Grounded
              </span>
            </div>
            <div className="mt-3 text-xs text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-[10px] font-mono font-semibold text-slate-900">Page 8 Citation:</span>
              <p className="mt-1 text-slate-700 text-xs italic">
                “Empirical results demonstrated a 34% reduction in latency through decoupled indexing.”
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900">
            Turn documents into clear, cited answers.
          </h2>
          <p className="mt-3.5 text-sm leading-6 text-slate-600">
            DocuMind grounds every response directly in your uploaded materials —
            with exact page references.
          </p>

          <ul className="mt-6 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-slate-900" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-slate-400 font-medium">
          © {new Date().getFullYear()} DocuMind · Verified Document Knowledge
        </p>
      </aside>

      {/* ── Right panel (form) ── */}
      <section className="flex flex-1 flex-col items-center justify-center px-5 py-12 sm:px-8 lg:px-12 bg-white">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center justify-center lg:hidden">
          <DocuMindLogo size="md" withText={true} />
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to continue to your workspace.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <AlertCircle className="size-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500 font-medium">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-slate-900 hover:underline transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};
