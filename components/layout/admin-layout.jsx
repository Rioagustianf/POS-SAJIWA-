"use client";
import { useEffect, useState } from "react";
import AppSidebar from "./sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Tampilkan loading state saat pertama kali
  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Ambil roles dari user, default ke array kosong
  const roles = user?.roles || [];

  return (
    <SidebarProvider>
      <div
        className="min-h-screen bg-background flex w-full"
        style={{ maxWidth: "none", margin: 0 }}
      >
        <AppSidebar roles={roles} />
        <SidebarInset
          className="flex-1 flex flex-col w-full"
          style={{ maxWidth: "none", width: "100%" }}
        >
          <header className="flex h-10 shrink-0 items-center gap-2 border-b px-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="font-semibold text-sm">Admin Panel</div>
          </header>
          <main
            className="flex-1 overflow-auto p-3 w-full min-w-0"
            style={{ maxWidth: "none", width: "100%" }}
          >
            <div
              className="w-full min-w-0"
              style={{ maxWidth: "none", width: "100%" }}
            >
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
