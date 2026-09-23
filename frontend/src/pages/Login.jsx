import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Check, FileText, LockKeyhole, Mail, Sparkles, AlertCircle, Loader2 } from "lucide-react";
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

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { error, success } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
            {/* Visual card illustration */}
            <div className="hidden sm:flex mb-8 justify-center items-center h-44">
              <div className="relative w-64 h-36">
                <div className="-rotate-12 rounded-xl bg-indigo-100/10 border border-indigo-200/30 absolute top-4 left-6 w-24 h-32 flex items-center justify-center shadow-lg">
                  <FileText className="text-indigo-200/50 size-9" strokeWidth={1.2} />
                </div>
                <div className="rotate-3 rounded-xl bg-indigo-100/15 border border-indigo-200/40 absolute top-2 left-18 w-24 h-32 flex items-center justify-center shadow-lg">
                  <FileText className="text-indigo-100/70 size-9" strokeWidth={1.2} />
                </div>
                <div className="rotate-16 rounded-xl bg-indigo-100/20 border border-indigo-200/50 absolute top-6 left-30 w-24 h-32 flex items-center justify-center shadow-lg">
                  <FileText className="text-indigo-100/90 size-9" strokeWidth={1.2} />
                </div>
                <Sparkles className="text-indigo-200 absolute top-0 right-4 size-6 animate-pulse" />
                <Sparkles className="text-indigo-300 absolute bottom-1 left-2 size-4" />
              </div>
            </div>

            <h1 className="font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight">
              Ask questions. Get answers from your documents.
            </h1>
            <p className="text-indigo-100/80 text-base sm:text-lg leading-relaxed mt-4 max-w-lg">
              Turn long PDFs into clear, cited answers and practice quizzes in seconds.
            </p>

            <div className="text-indigo-100/90 text-sm grid mt-8 gap-3">
              <div className="flex items-center gap-3">
                <Check className="text-indigo-300 size-4 shrink-0" strokeWidth={2.5} />
                <span>Answers grounded in your files</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="text-indigo-300 size-4 shrink-0" strokeWidth={2.5} />
                <span>Sources linked to every response</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="text-indigo-300 size-4 shrink-0" strokeWidth={2.5} />
                <span>AI exam quiz generation with instant scoring</span>
              </div>
            </div>
          </div>

          <div className="text-indigo-200/60 text-xs relative z-10">
            Your documents, understood.
          </div>
        </section>

        {/* Right Form section matching Screen-1 */}
        <section className="flex min-h-dvh items-start justify-center overflow-y-auto bg-[#080512] p-4 sm:p-8 lg:items-center">
          <div className="flex w-full max-w-[420px] flex-col items-center py-6 sm:py-10">
            <div className="mb-9 flex items-center gap-2.5 text-lg font-semibold tracking-tight text-white">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-xs">
                <Sparkles className="size-4" />
              </div>
              <span>DocuMind</span>
            </div>

          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-400">Sign in to continue to your workspace.</p>
          </div>

          <Card className="w-full rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 sm:p-7">
            <CardHeader className="p-0 gap-2 mb-6">
              <CardTitle className="text-lg font-semibold tracking-tight text-white">Sign in</CardTitle>
              <CardDescription className="text-sm text-slate-400">Use your account details below.</CardDescription>
            </CardHeader>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <CardContent className="p-0 flex flex-col gap-4">
                <div className="grid gap-2">
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

                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-slate-200" htmlFor="password">Password</Label>
                  </div>
                  <div className="relative">
                    <LockKeyhole className="-translate-y-1/2 text-muted-foreground absolute top-1/2 left-3.5 size-4" />
                    <Input
                      id="password"
                      type="password"
                      required
                      placeholder="Enter your password"
                      className="h-11 rounded-lg border-white/10 bg-black/20 pl-10.5 text-white placeholder:text-slate-500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-0 flex flex-col gap-4 mt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-lg bg-violet-600 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 hover:bg-violet-500"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    "Sign in"
                  )}
                </Button>

                <p className="text-center text-xs text-slate-400">
                  Don&apos;t have an account?{" "}
                  <Link to="/register" className="font-semibold text-violet-300 hover:text-violet-200">
                    Create one
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
