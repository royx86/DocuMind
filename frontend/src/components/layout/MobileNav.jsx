import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FileText,
  History,
  MessageSquarePlus,
  Settings,
  LayoutDashboard,
  GraduationCap,
  X,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const MobileNav = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  if (!open) return null;

  const navItems = [
    { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { label: "New Chat", path: "/chat", icon: MessageSquarePlus },
    { label: "Documents", path: "/documents", icon: FileText },
    { label: "Practice Quiz", path: "/quiz", icon: GraduationCap },
    { label: "History", path: "/history", icon: History },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-72 max-w-[85%] bg-sidebar text-foreground h-full shadow-2xl flex flex-col p-5 animate-in slide-in-from-left duration-200">
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="size-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">DocuMind</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 mt-6 flex-1">
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
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                className={cn(
                  "font-medium text-left rounded-xl flex px-3.5 items-center gap-3 h-11 text-sm transition-all",
                  isActive
                    ? "bg-primary/12 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-primary/8 hover:text-primary"
                )}
              >
                <Icon className={cn("size-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/");
              logout();
            }}
            className="w-full flex items-center gap-3 px-3.5 h-11 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
          >
            <LogOut className="size-5 shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
