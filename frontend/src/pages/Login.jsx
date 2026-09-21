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

  const [email, setEmail] = useState("saswata@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      await login(email, password);
      success("Welcome back to DocuMind!");
      navigate("/");
    } catch (err) {
      setErrorMessage(err.message || "Invalid email or password");
      error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen w-screen overflow-x-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[46%_54%] min-h-screen">
        {/* Left Hero section matching Screen-1 */}
        <section className="bg-[#1e1b4b] text-white flex relative p-8 lg:p-12 flex-col justify-between min-h-[420px] lg:min-h-screen overflow-hidden">
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
        <section className="bg-muted/30 flex relative p-6 sm:p-12 justify-center items-center min-h-screen">
          <div className="shadow-2xs rounded-xl bg-background text-foreground text-xs border border-border flex absolute top-6 right-6 px-3.5 py-2 items-center gap-2">
            <span className="rounded-full bg-emerald-500 size-2 animate-pulse" />
            <span className="font-medium">All systems operational</span>
          </div>

          <Card className="shadow-sm rounded-2xl bg-background border-border p-6 sm:p-8 w-full max-w-[420px]">
            <CardHeader className="p-0 gap-2 mb-6">
              <div className="font-bold text-primary text-xs tracking-widest uppercase">
                WELCOME BACK
              </div>
              <CardTitle className="font-bold text-2xl sm:text-3xl tracking-tight text-foreground">
                Sign in to your workspace
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Continue where you left off.
              </CardDescription>
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
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="-translate-y-1/2 text-muted-foreground absolute top-1/2 left-3.5 size-4" />
                    <Input
                      id="email"
                      type="email"
                      required
                      className="pl-10.5 h-11 rounded-xl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <div className="relative">
                    <LockKeyhole className="-translate-y-1/2 text-muted-foreground absolute top-1/2 left-3.5 size-4" />
                    <Input
                      id="password"
                      type="password"
                      required
                      className="pl-10.5 h-11 rounded-xl"
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
                  className="rounded-xl bg-primary text-primary-foreground w-full h-11 text-sm font-semibold shadow-xs hover:shadow-md hover:-translate-y-0.5"
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

                <p className="text-center text-xs text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/register" className="font-semibold text-primary hover:underline">
                    Sign up
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </section>
      </div>
    </div>
  );
};
