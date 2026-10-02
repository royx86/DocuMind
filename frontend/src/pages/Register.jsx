import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  LockKeyhole,
  Mail,
  User,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  GraduationCap,
  MessageCircle,
  FileText,
} from "lucide-react";
import { DocuMindLogo } from "@/components/ui/DocuMindLogo";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

const PERKS = [
  { icon: MessageCircle, text: "Strictly cited Q&A from your own files" },
  { icon: GraduationCap, text: "Auto-generated practice exams with instant grading" },
  { icon: Brain, text: "Multi-document synthesis in a unified workspace" },
];

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { error, success } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    if (!acceptedTerms) {
      setErrorMessage("Please accept the Terms of Service to continue.");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      success("Account created successfully! Welcome to DocuMind.");
      navigate("/dashboard");
    } catch (err) {
      setErrorMessage(err.message || "Registration failed. Try again.");
      error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-white text-slate-900 flex">
      {/* ── Left decorative panel ── */}
      <aside className="relative hidden overflow-hidden lg:flex lg:w-[48%] flex-col justify-between p-12 xl:p-16 bg-slate-50 border-r border-slate-200/80">
        <div className="relative z-10 flex items-center">
          <DocuMindLogo size="md" withText={true} subtitle="Workspace" />
        </div>

        <div className="relative z-10 max-w-sm">
          {/* Document Preview Card */}
          <div className="mb-10 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center">
                  <FileText className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Cognitive_Psychology_101.pdf</p>
                  <p className="text-[10px] text-slate-500">24 indexed pages · Grounded</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                Verified
              </span>
            </div>
            <div className="mt-3 text-xs text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-[10px] font-mono font-semibold text-slate-900">Page 14 Citation:</span>
              <p className="mt-1 text-slate-700 text-xs italic">
                “Working memory capacity is strictly modulated by prefrontal cortex attenuation…”
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900">
            Start turning documents into insight — for free.
          </h2>
          <p className="mt-3.5 text-sm leading-6 text-slate-600">
            No credit card needed. Upload your first document and ask your first
            question in under 2 minutes.
          </p>

          <ul className="mt-6 space-y-4">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-900 shadow-2xs">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-medium text-slate-700">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-slate-400 font-medium">
          © {new Date().getFullYear()} DocuMind · Verified Document Knowledge
        </p>
      </aside>

      {/* ── Right form panel ── */}
      <section className="flex flex-1 flex-col items-center justify-center px-5 py-12 sm:px-8 lg:px-12 bg-white">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center justify-center lg:hidden">
          <DocuMindLogo size="md" withText={true} />
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Start turning your documents into clear, cited answers.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <AlertCircle className="size-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-name" className="text-xs font-semibold text-slate-700">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  id="reg-name"
                  type="text"
                  required
                  minLength={2}
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-email" className="text-xs font-semibold text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  id="reg-email"
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
              <label htmlFor="reg-password" className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
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

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-confirm-password" className="text-xs font-semibold text-slate-700">
                Repeat password
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  id="reg-confirm-password"
                  type={showConfirm ? "text" : "password"}
                  required
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide" : "Show"}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Terms checkbox */}
            <label className="flex cursor-pointer items-start gap-2.5 text-xs text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 size-3.5 shrink-0 rounded accent-slate-900"
              />
              <span>
                I agree to the{" "}
                <span className="text-slate-900 underline">Terms of Service</span> and{" "}
                <span className="text-slate-900 underline">Privacy Policy</span>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500 font-medium">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-slate-900 hover:underline transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};
