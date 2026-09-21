import React, { useState } from "react";
import { User as UserIcon, Key, HardDrive, ShieldCheck, Check, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useTheme } from "@/context/ThemeContext";

export const Settings = () => {
  const { user } = useAuth();
  const { success } = useToast();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem("documind_gemini_key") || "");
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem("documind_openai_key") || "");
  const [saved, setSaved] = useState(false);

  const getInitials = (n) => {
    if (!n) return "U";
    return n
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    success("Profile preferences updated");
  };

  const handleSaveApiKeys = (e) => {
    e.preventDefault();
    if (geminiKey) localStorage.setItem("documind_gemini_key", geminiKey);
    else localStorage.removeItem("documind_gemini_key");

    if (openaiKey) localStorage.setItem("documind_openai_key", openaiKey);
    else localStorage.removeItem("documind_openai_key");

    setSaved(true);
    success("AI configuration saved successfully");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto p-6 md:p-12 w-full max-w-[800px] flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <h1 className="font-bold text-3xl tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground text-base">
            Manage your workspace, profile, appearance, and AI model configurations
          </p>
        </div>

        {/* Appearance / Theme */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-bold text-lg text-foreground">Appearance</h2>
            <p className="text-muted-foreground text-sm">
              Customize the look and feel of your DocuMind workspace.
            </p>
          </div>
          <Card className="p-6 rounded-2xl shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                  theme === "light"
                    ? "border-primary bg-primary/5 text-foreground shadow-xs"
                    : "border-border hover:border-border/80 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className={`p-3 rounded-xl ${theme === "light" ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}>
                  <Sun className="size-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">White / Light Mode</h3>
                  <p className="text-xs text-muted-foreground">Crisp, clean light theme</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                  theme === "dark"
                    ? "border-primary bg-primary/10 text-foreground shadow-xs"
                    : "border-border hover:border-border/80 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className={`p-3 rounded-xl ${theme === "dark" ? "bg-indigo-950/60 text-indigo-400" : "bg-muted text-muted-foreground"}`}>
                  <Moon className="size-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Dark Mode</h3>
                  <p className="text-xs text-muted-foreground">Easy on the eyes for night study</p>
                </div>
              </button>
            </div>
          </Card>
        </section>

        {/* Profile Card matching Screen-8 */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-bold text-lg text-foreground">Profile</h2>
            <p className="text-muted-foreground text-sm">
              Update your personal display information.
            </p>
          </div>
          <Card className="p-6 gap-6 rounded-2xl shadow-xs">
            <CardHeader className="p-0 flex-row items-center gap-4">
              <div className="font-bold rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white text-lg flex justify-center items-center shrink-0 size-16 shadow-2xs">
                {getInitials(user?.name)}
              </div>
              <div>
                <h3 className="font-semibold text-base text-foreground">{user?.name}</h3>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </CardHeader>

            <form onSubmit={handleSaveProfile}>
              <CardContent className="grid p-0 gap-6 grid-cols-1 sm:grid-cols-2 mt-6">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="settings-name">Name</Label>
                  <Input
                    id="settings-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="settings-email">Email</Label>
                  <Input
                    id="settings-email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted opacity-70 rounded-xl"
                  />
                </div>
              </CardContent>

              <CardFooter className="p-0 justify-end mt-6">
                <Button type="submit" className="shadow-xs hover:shadow-md hover:-translate-y-0.5">
                  Save profile
                </Button>
              </CardFooter>
            </form>
          </Card>
        </section>

        {/* AI & Model Configuration */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-bold text-lg text-foreground">AI & Model Configuration</h2>
            <p className="text-muted-foreground text-sm">
              DocuMind features a built-in smart offline RAG and quiz engine. Optionally supply your own API key for Gemini or OpenAI.
            </p>
          </div>
          <Card className="p-6 rounded-2xl shadow-xs">
            <form onSubmit={handleSaveApiKeys} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="gemini-key">Google Gemini API Key (Optional)</Label>
                <Input
                  id="gemini-key"
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  Used for Gemini 2.0 Flash document Q&A and exam quiz generation.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="openai-key">OpenAI API Key (Optional)</Label>
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  Alternative provider using GPT-4o-mini.
                </p>
              </div>

              <div className="flex justify-end mt-2">
                <Button type="submit" className="gap-2 shadow-xs hover:shadow-md hover:-translate-y-0.5">
                  {saved && <Check className="size-4" />}
                  <span>Save AI Configuration</span>
                </Button>
              </div>
            </form>
          </Card>
        </section>

        {/* Storage Usage matching Screen-8 */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-bold text-lg text-foreground">Storage & Plan</h2>
            <p className="text-muted-foreground text-sm">
              Your document storage and account quota.
            </p>
          </div>
          <Card className="p-6 flex flex-col gap-4 rounded-2xl shadow-xs">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-foreground">Workspace Storage</span>
              <span className="text-muted-foreground">42.8 MB of 1.0 GB used</span>
            </div>
            <Progress value={4.2} />
            <div className="flex justify-between items-center pt-2 text-xs text-muted-foreground">
              <span>Unlimited Document Q&A Queries</span>
              <span className="font-semibold text-primary">Pro Plan Active</span>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};
