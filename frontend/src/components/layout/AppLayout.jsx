import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { useAuth } from "@/hooks/useAuth";

export const AppLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-9 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground w-full">
      <Sidebar />
      <MobileNav open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 min-h-screen overflow-x-hidden">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className={`flex-1 min-h-0 ${location.pathname.startsWith("/chat") ? "overflow-hidden" : "overflow-y-auto"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
