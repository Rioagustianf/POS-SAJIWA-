// Menandai bahwa komponen ini berjalan di sisi klien
"use client";
// Import hooks yang diperlukan dari React
import { useEffect, useState } from "react";
// Import komponen Sidebar untuk navigasi
import AppSidebar from "@/components/layout/sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

// Mendefinisikan dan mengekspor komponen layout utama dengan props children
export default function PosLayout({ children }) {
  // State untuk menyimpan data user
  const [user, setUser] = useState(null);
  // State untuk menandai proses loading
  const [loading, setIsLoading] = useState(true);

  // Effect hook untuk fetch data user saat komponen dimount
  useEffect(() => {
    // Fungsi async untuk mengambil data user
    const fetchUser = async () => {
      try {
        // Set loading state menjadi true sebelum fetch
        setIsLoading(true);
        // Melakukan request GET ke endpoint /api/auth/me
        const response = await fetch("/api/auth/me");
        // Jika response berhasil, simpan data user ke state
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          // Log error jika response tidak ok
          console.error("Failed to fetch user data: Server returned an error");
        }
      } catch (error) {
        // Log error jika terjadi kesalahan dalam fetch
        console.error("Failed to fetch user data:", error);
      } finally {
        // Set loading menjadi false setelah proses selesai
        setIsLoading(false);
      }
    };

    // Jalankan fungsi fetchUser
    fetchUser();
  }, []);

  // Ekstrak roles dari user data, jika tidak ada gunakan array kosong
  const roles = user?.roles || [];

  // Tampilkan loading spinner jika sedang loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render layout utama dengan sidebar dan konten
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        {/* Render Sidebar dengan passing props roles */}
        <AppSidebar roles={roles} />
        {/* Container untuk konten utama */}
        <SidebarInset className="flex-1 flex flex-col w-full min-w-0">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 bg-background w-full min-w-0">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="font-semibold">Transaksi Baru</div>
          </header>
          {/* Render children components */}
          <main className="flex-1 overflow-auto w-full min-w-0">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
