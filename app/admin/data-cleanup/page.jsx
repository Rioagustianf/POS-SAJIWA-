"use client";

import { useState } from "react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/admin-layout";

const CLEANUP_TYPES = [
  { value: "transactions", label: "Transaksi Lama" },
  { value: "auditLogs", label: "Audit Log Lama" },
  { value: "inactiveProducts", label: "Produk Tidak Aktif" },
  { value: "inactiveUsers", label: "User Tidak Aktif" },
];

export default function DataCleanupPage() {
  const [type, setType] = useState("");
  const [beforeDate, setBeforeDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || !beforeDate) {
      toast.error("Pilih jenis data dan tanggal batas!");
      return;
    }
    setIsLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/data-cleanup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, beforeDate }),
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
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
          >
            {isLoading ? "Memproses..." : "Mulai Cleanup"}
          </button>
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
