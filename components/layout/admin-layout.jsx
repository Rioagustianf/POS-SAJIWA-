"use client";
import { useEffect, useState } from "react";
import Sidebar from "./sidebar";

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
    <div className="min-h-screen bg-background">
      <Sidebar roles={roles} />
      <div className="lg:ml-72 min-h-screen">
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
