import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Check, FileText, LockKeyhole, Mail, User, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { error, success } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage("Please accept the Terms of Service and Privacy Policy");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, confirmPassword);
      success("Account created successfully! Welcome to DocuMind.");
      navigate("/dashboard");
    } catch (err) {
      setErrorMessage(err.message || "Failed to create account");
      error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-[#080512] text-white">
      <div className="grid min-h-dvh grid-cols-1">
        {/* Left Hero section matching Screen-1 */}
        <section className="hidden">
          <div className="relative z-10">
            <div className="font-bold text-xl tracking-tight flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-xs">
                <Sparkles className="size-4" />
              </div>
              <span>DocuMind</span>
            </div>
          </div>

          <div className="relative z-10 max-w-xl my-8">
            <h1 className="font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight">
              Transform your documents into interactive study guides.
            </h1>
            <p className="text-indigo-100/80 text-base sm:text-lg leading-relaxed mt-4 max-w-lg">
              Upload notes, textbooks, and reports. Ask questions, cite sources, and practice with AI-generated quizzes.
            </p>

            <div className="text-indigo-100/90 text-sm grid mt-8 gap-3">
              <div className="flex items-center gap-3">
                <Check className="text-indigo-300 size-4 shrink-0" strokeWidth={2.5} />
                <span>Instant RAG answers with exact page citations</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="text-indigo-300 size-4 shrink-0" strokeWidth={2.5} />
                <span>Exam practice quizzes with backend scoring & reviews</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="text-indigo-300 size-4 shrink-0" strokeWidth={2.5} />
                <span>Split-view document reader and workspace</span>
              </div>
            </div>
          </div>

          <div className="text-indigo-200/60 text-xs relative z-10">
            Your documents, understood.
          </div>
        </section>

        {/* Right Form section */}
        <section className="flex min-h-dvh items-start justify-center overflow-y-auto bg-[#080512] p-4 sm:p-8 lg:items-center">
          <div className="flex w-full max-w-[440px] flex-col items-center py-6 sm:py-10">
            <div className="mb-9 flex items-center gap-2.5 text-lg font-semibold tracking-tight text-white">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-xs">
                <Sparkles className="size-4" />
              </div>
              <span>DocuMind</span>
            </div>

          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Create your account</h1>
            <p className="mt-2 text-sm text-slate-400">Start turning documents into clear answers.</p>
          </div>

          <Card className="w-full rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 sm:p-7">
            <CardHeader className="p-0 gap-2 mb-6">
              <CardTitle className="text-lg font-semibold tracking-tight text-white">Your details</CardTitle>
              <CardDescription className="text-sm text-slate-400">Set up your DocuMind workspace.</CardDescription>
            </CardHeader>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <CardContent className="p-0 flex flex-col gap-3.5">
                <div className="grid gap-1.5">
                  <Label className="text-slate-200" htmlFor="name">Name</Label>
                  <div className="relative">
                    <User className="-translate-y-1/2 text-muted-foreground absolute top-1/2 left-3.5 size-4" />
                    <Input
                      id="name"
                      type="text"
                      required
                      placeholder="Saswata Roy"
                      className="h-11 rounded-lg border-white/10 bg-black/20 pl-10.5 text-white placeholder:text-slate-500"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-slate-200" htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="-translate-y-1/2 text-muted-foreground absolute top-1/2 left-3.5 size-4" />
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="h-11 rounded-lg border-white/10 bg-black/20 pl-10.5 text-white placeholder:text-slate-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-slate-200" htmlFor="password">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="-translate-y-1/2 text-muted-foreground absolute top-1/2 left-3.5 size-4" />
                    <Input
                      id="password"
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      className="h-11 rounded-lg border-white/10 bg-black/20 pl-10.5 text-white placeholder:text-slate-500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-slate-200" htmlFor="confirm-password">Repeat password</Label>
                  <div className="relative">
                    <LockKeyhole className="-translate-y-1/2 text-muted-foreground absolute top-1/2 left-3.5 size-4" />
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      placeholder="Repeat password"
                      className="h-11 rounded-lg border-white/10 bg-black/20 pl-10.5 text-white placeholder:text-slate-500"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>

              <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 size-3.5 shrink-0 accent-violet-500"
                />
                <span>I agree to the Terms of Service and Privacy Policy</span>
              </label>

              <CardFooter className="p-0 flex flex-col gap-4 mt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-lg bg-violet-600 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 hover:bg-violet-500"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    "Create account"
                  )}
                </Button>

                <p className="text-center text-xs text-slate-400">
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold text-violet-300 hover:text-violet-200">
                    Log in
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
          </div>
        </section>
      </div>
    </div>
  );
};
