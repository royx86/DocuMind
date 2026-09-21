import React, { useState, useRef, useEffect } from "react";
import { Bell, ChevronRight, Menu, Moon, Sun, User as UserIcon, Settings, LogOut, ChevronDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Header = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setShowMenu(false);
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showMenu]);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getPageTitle = (path) => {
    if (path === "/") return "Overview";
    if (path.startsWith("/documents")) return "Documents";
    if (path.startsWith("/workspace")) return "Workspace";
    if (path.startsWith("/chat")) return "Chat";
    if (path.startsWith("/quiz")) return "Practice Quiz";
    if (path.startsWith("/history")) return "History";
    if (path.startsWith("/settings")) return "Settings";
    return "Workspace";
  };

  return (
    <header className="border-b border-border bg-background flex px-4 md:px-12 justify-between items-center h-16 md:h-20 shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
            aria-label="Open mobile menu"
          >
            <Menu className="size-5" />
          </button>
        )}
        <div className="text-muted-foreground text-sm flex items-center gap-2">
          <span className="hidden sm:inline font-medium">Workspace</span>
          <ChevronRight className="size-4 hidden sm:inline text-muted-foreground/60" />
          <span className="font-semibold text-foreground">{getPageTitle(location.pathname)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Theme Toggle Button (Dark / Light Mode) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg text-muted-foreground p-2 hover:bg-accent hover:text-foreground transition-all duration-180 cursor-pointer"
          aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <Sun className="size-5 text-amber-400 hover:rotate-45 transition-transform duration-200" />
          ) : (
            <Moon className="size-5 text-indigo-600 hover:-rotate-12 transition-transform duration-200" />
          )}
        </button>

        <button
          type="button"
          className="rounded-lg text-muted-foreground relative p-2 hover:bg-accent hover:text-foreground transition-all duration-180 cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <span className="rounded-full bg-primary absolute top-2 right-2 size-2 ring-2 ring-background" />
        </button>

        <span className="hidden sm:inline-flex font-semibold rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 text-primary text-xs border border-primary/25 px-3 py-1 shadow-2xs">
          Pro plan
        </span>

        <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

        {/* User Profile in Top Right */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 pl-1.5 rounded-xl hover:bg-accent transition-all duration-180 cursor-pointer group"
            aria-label="User profile menu"
            aria-expanded={showMenu}
          >
            <span className="font-semibold rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white text-xs flex justify-center items-center shrink-0 size-8.5 shadow-2xs group-hover:scale-105 transition-transform">
              {getInitials(user?.name)}
            </span>
            <div className="hidden md:flex flex-col text-left">
              <span className="font-medium text-xs text-foreground leading-tight max-w-[110px] truncate">
                {user?.name || "User"}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight max-w-[110px] truncate">
                {user?.email || "user@example.com"}
              </span>
            </div>
            <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform duration-200", showMenu && "rotate-180")} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-popover text-popover-foreground rounded-2xl shadow-xl border border-border p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="font-semibold text-sm truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "user@example.com"}</p>
                <div className="mt-2 sm:hidden">
                  <span className="font-semibold rounded-full bg-primary/10 text-primary text-[10px] border border-primary/20 px-2 py-0.5">
                    Pro plan
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    navigate("/settings");
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-accent transition-colors cursor-pointer w-full text-left"
                >
                  <UserIcon className="size-4 text-muted-foreground" />
                  <span>Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    navigate("/settings");
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-accent transition-colors cursor-pointer w-full text-left"
                >
                  <Settings className="size-4 text-muted-foreground" />
                  <span>Settings</span>
                </button>
                <div className="h-px bg-border my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    logout();
                    navigate("/login");
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-destructive hover:bg-destructive/10 transition-colors cursor-pointer w-full text-left"
                >
                  <LogOut className="size-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
