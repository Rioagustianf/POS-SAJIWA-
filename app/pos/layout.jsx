"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/sidebar";

export default function PosLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          console.error("Failed to fetch user data: Server returned an error");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Ambil roles (array), default []
  const roles = user?.roles || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar roles={roles} />
      <div className="lg:ml-72 min-h-screen">
        <main>{children}</main>
      </div>
    </div>
  );
}
