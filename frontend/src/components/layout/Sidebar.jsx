import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FileText,
  History,
  MessageSquarePlus,
  Settings,
  LayoutDashboard,
  GraduationCap,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { label: "New Chat", path: "/chat", icon: MessageSquarePlus },
    { label: "Documents", path: "/documents", icon: FileText },
    { label: "Practice Quiz", path: "/quiz", icon: GraduationCap },
    { label: "History", path: "/history", icon: History },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <aside className="bg-sidebar text-foreground border-r border-border hidden md:flex pt-5 pr-4 pb-5 pl-4 flex-col w-[248px] h-screen shrink-0 sticky top-0">
      {/* Brand */}
      <div
        className="flex pr-2 pl-2 items-center gap-2.5 h-11 cursor-pointer group"
        onClick={() => navigate("/dashboard")}
      >
        <div className="size-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
          <Sparkles className="size-4.5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-foreground text-xl tracking-tight leading-tight">
            DocuMind
          </span>
          <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
            AI Study Workspace
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex mt-8 flex-col flex-1 gap-1.5" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={cn(
                "font-medium text-left rounded-xl flex pr-3.5 pl-3.5 items-center gap-3 h-11 text-sm cursor-pointer transition-all duration-200",
                isActive
                  ? "bg-primary/12 text-primary font-semibold shadow-2xs translate-x-0.5"
                  : "text-muted-foreground hover:bg-primary/8 hover:text-primary hover:translate-x-1"
              )}
            >
              <Icon className={cn("size-5 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout button */}
      <div className="border-t border-border pt-4">
        <button
          type="button"
          onClick={() => {
            navigate("/");
            logout();
          }}
          className="font-medium text-left rounded-xl flex pr-3.5 pl-3.5 items-center gap-3 h-11 text-sm w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-all duration-200 group"
        >
          <LogOut className="size-5 shrink-0 transition-colors group-hover:text-destructive" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
};
