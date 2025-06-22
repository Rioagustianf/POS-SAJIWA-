"use client";

import { useState } from "react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/admin-layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CLEANUP_TYPES = [
  { value: "transactions", label: "Transaksi Lama" },
  { value: "auditLogs", label: "Audit Log Lama" },
  { value: "inactiveProducts", label: "Produk Tidak Aktif" },
  { value: "inactiveUsers", label: "User Tidak Aktif" },
];

// Komponen utama untuk halaman pembersihan data
export default function DataCleanupPage() {
  // State untuk tipe data yang akan dibersihkan
  const [type, setType] = useState("");
  // State untuk tanggal batas sebelum data dihapus
  const [beforeDate, setBeforeDate] = useState("");
  // State untuk status loading
  const [isLoading, setIsLoading] = useState(false);
  // State untuk hasil proses pembersihan
  const [result, setResult] = useState("");
  // State untuk mengontrol dialog konfirmasi
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fungsi untuk menjalankan pembersihan data setelah konfirmasi
  const handleCleanup = async () => {
    setIsLoading(true);
    setResult("");
    try {
      // Kirim request ke endpoint API pembersihan data
      const res = await fetch("/api/data-cleanup", {
        method: "POST", // Gunakan method POST untuk mengirim data
        credentials: "include", // Sertakan kredensial (cookies) untuk autentikasi
        headers: {
          "Content-Type": "application/json", // Set header content type JSON
        },
        body: JSON.stringify({
          type, // Kirim tipe data yang akan dibersihkan (transactions/auditLogs/dll)
          beforeDate, // Kirim tanggal batas data yang akan dihapus (format: YYYY-MM-DD)
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setResult(data.message);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk submit form, hanya memvalidasi dan membuka dialog
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!type || !beforeDate) {
      toast.error("Pilih jenis data dan tanggal batas!");
      return;
    }

    setIsDialogOpen(true); // Membuka dialog konfirmasi
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto mt-8 bg-card rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Data Cleanup</h1>
        <p className="mb-4 text-muted-foreground">
          Fitur ini hanya untuk <b>Manajer</b>. Hati-hati, data yang dihapus
          tidak dapat dikembalikan!
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">
              Jenis Data yang Akan Dihapus
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
            >
              <option value="">-- Pilih Jenis Data --</option>
              {CLEANUP_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">
              Hapus Data Sebelum Tanggal
            </label>
            <input
              type="date"
              value={beforeDate}
              onChange={(e) => setBeforeDate(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
            />
          </div>
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
              >
                {isLoading ? "Memproses..." : "Mulai Cleanup"}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Anda yakin sepenuhnya?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Data yang dipilih akan
                  dihapus secara permanen dari server.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleCleanup}>
                  Lanjutkan
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </form>
        {result && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
            {result}
          </div>
        )}
        <div className="mt-8 text-sm text-muted-foreground border-t pt-4">
          <b>Peringatan:</b> Data yang dihapus melalui fitur ini{" "}
          <b>tidak dapat dikembalikan</b>. Hanya Manajer yang dapat mengakses
          fitur ini.
        </div>
      </div>
    </AdminLayout>
  );
}
