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

    setLoading(true);
    try {
      await register(name, email, password, confirmPassword);
      success("Account created successfully! Welcome to DocuMind.");
      navigate("/");
    } catch (err) {
      setErrorMessage(err.message || "Failed to create account");
      error(err.message || "Registration failed");
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
        <section className="bg-muted/30 flex relative p-6 sm:p-12 justify-center items-center min-h-screen">
          <Card className="shadow-sm rounded-2xl bg-background border-border p-6 sm:p-8 w-full max-w-[440px]">
            <CardHeader className="p-0 gap-2 mb-6">
              <div className="font-bold text-primary text-xs tracking-widest uppercase">
                GET STARTED
              </div>
              <CardTitle className="font-bold text-2xl sm:text-3xl tracking-tight text-foreground">
                Create your workspace
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Start learning faster with DocuMind.
              </CardDescription>
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
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="-translate-y-1/2 text-muted-foreground absolute top-1/2 left-3.5 size-4" />
                    <Input
                      id="name"
                      type="text"
                      required
                      placeholder="Saswata Roy"
                      className="pl-10.5 h-11 rounded-xl"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="-translate-y-1/2 text-muted-foreground absolute top-1/2 left-3.5 size-4" />
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="pl-10.5 h-11 rounded-xl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="-translate-y-1/2 text-muted-foreground absolute top-1/2 left-3.5 size-4" />
                    <Input
                      id="password"
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      className="pl-10.5 h-11 rounded-xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <LockKeyhole className="-translate-y-1/2 text-muted-foreground absolute top-1/2 left-3.5 size-4" />
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      placeholder="Repeat password"
                      className="pl-10.5 h-11 rounded-xl"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    "Create account"
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold text-primary hover:underline">
                    Sign in
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
