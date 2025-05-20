// Menandai bahwa komponen ini berjalan di sisi klien
"use client";

// Import hooks dari React dan komponen icon dari Lucide
import { useState, useEffect } from "react";
import { Calendar, Search, FileText, ArrowUpDown, Eye } from "lucide-react";
// Import fungsi format untuk memformat tanggal
import { format } from "date-fns";
// Komentar untuk menjelaskan bahwa sidebar sudah ditangani layout
// Tidak perlu import sidebar lagi karena sudah ditangani oleh layout

// Mendefinisikan dan mengekspor komponen utama SalesHistory
export default function SalesHistory() {
  // State untuk menyimpan daftar transaksi
  const [transactions, setTransactions] = useState([]);
  // State untuk menandai proses loading
  const [isLoading, setIsLoading] = useState(true);
  // State untuk menyimpan kata kunci pencarian
  const [searchTerm, setSearchTerm] = useState("");
  // State untuk menyimpan filter tanggal
  const [dateFilter, setDateFilter] = useState("");
  // State untuk mengontrol tampilan modal struk
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  // State untuk menyimpan transaksi yang dipilih
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  // State untuk menyimpan data user
  const [user, setUser] = useState(null);

  // Effect untuk mengambil data user dan transaksi saat komponen dimount
  useEffect(() => {
    // Mendefinisikan fungsi async untuk fetch data
    const fetchData = async () => {
      try {
        // Mengambil data user dari API
        const userResponse = await fetch("/api/auth/me");
        // Jika response OK, simpan data user ke state
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
        }

        // Mengambil data transaksi dari API
        const response = await fetch("/api/transactions", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        // Jika response tidak OK, throw error
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch transactions");
        }

        // Parse response JSON
        const data = await response.json();
        console.log("Fetched Transactions:", data);

        // Update state transactions, pastikan data adalah array
        setTransactions(Array.isArray(data) ? data : []);
        // Matikan loading state
        setIsLoading(false);
      } catch (error) {
        // Log error dan reset state jika terjadi kesalahan
        console.error("Error fetching data:", error);
        setTransactions([]);
        setIsLoading(false);
      }
    };

    // Jalankan fungsi fetchData
    fetchData();
  }, []); // Dependencies array kosong, effect hanya dijalankan sekali

  // Handler untuk update state searchTerm saat pencarian
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handler untuk update state dateFilter saat memilih tanggal
  const handleDateFilter = (e) => {
    setDateFilter(e.target.value);
  };

  // Handler untuk menampilkan modal struk
  const viewReceipt = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
  };

  // Filter transaksi berdasarkan pencarian dan tanggal
  const filteredTransactions = transactions.filter((transaction) => {
    // Cek apakah ID transaksi mengandung searchTerm
    const matchesSearch = transaction.id.toString().includes(searchTerm);

    // Cek apakah tanggal transaksi sesuai dengan filter
    const matchesDate = dateFilter
      ? format(new Date(transaction.date), "yyyy-MM-dd") === dateFilter
      : true;

    // Return true jika kedua kondisi terpenuhi
    return matchesSearch && matchesDate;
  });

  // Fungsi untuk memformat angka ke format mata uang
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Render komponen
  return (
    // Container utama dengan padding
    <div className="p-4 md:p-6">
      {/* Judul halaman */}
      <h1 className="text-3xl font-bold mb-6">Sales History</h1>

      {/* Container untuk filter pencarian dan tanggal */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Input pencarian dengan icon */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search by transaction ID..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-9 pr-4 py-2 border border-input rounded-md w-full bg-background"
          />
        </div>

        {/* Input filter tanggal dengan icon */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="date"
            value={dateFilter}
            onChange={handleDateFilter}
            className="pl-9 pr-4 py-2 border border-input rounded-md bg-background"
          />
        </div>
      </div>

      {/* Tampilkan loading spinner atau tabel transaksi */}
      {isLoading ? (
        // Loading spinner
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">
              Loading transactions...
            </p>
          </div>
        </div>
      ) : (
        // Tabel transaksi
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Header tabel */}
              <thead>
                <tr className="bg-muted/50">
                  {/* Kolom ID transaksi dengan icon sort */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-1">
                      Transaction ID
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  {/* Kolom tanggal dengan icon sort */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-1">
                      Date
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  {/* Kolom kasir */}
                  <th className="px-4 py-3 text-left">Cashier</th>
                  {/* Kolom total dengan icon sort */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-1">
                      Total
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  {/* Kolom metode pembayaran */}
                  <th className="px-4 py-3 text-left">Payment Method</th>
                  {/* Kolom aksi */}
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              {/* Body tabel */}
              <tbody>
                {/* Render baris transaksi jika ada data */}
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    // Baris transaksi
                    <tr key={transaction.id} className="border-t border-border">
                      {/* Sel ID transaksi */}
                      <td className="px-4 py-3 font-medium">
                        #{transaction.id}
                      </td>
                      {/* Sel tanggal */}
                      <td className="px-4 py-3">
                        {format(new Date(transaction.date), "yyyy-MM-dd HH:mm")}
                      </td>
                      {/* Sel kasir */}
                      <td className="px-4 py-3">{transaction.cashier}</td>
                      {/* Sel total */}
                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(transaction.total)}
                      </td>
                      {/* Sel metode pembayaran */}
                      <td className="px-4 py-3 capitalize">
                        {transaction.paymentMethod}
                      </td>
                      {/* Sel tombol aksi */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => viewReceipt(transaction)}
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  // Tampilkan pesan jika tidak ada data
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal struk */}
      {showReceiptModal && selectedTransaction && (
        // Overlay modal
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          {/* Container modal */}
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              {/* Header modal */}
              <div className="text-center mb-4">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <h2 className="text-xl font-bold">
                  Receipt #{selectedTransaction.id}
                </h2>
                <p className="text-muted-foreground">Sajiwa Steak Restaurant</p>
              </div>

              {/* Informasi transaksi */}
              <div className="border-t border-b border-border py-3 my-3">
                <div className="flex justify-between text-sm">
                  <span>Date:</span>
                  <span>
                    {format(
                      new Date(selectedTransaction.date),
                      "yyyy-MM-dd HH:mm"
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cashier:</span>
                  <span>{selectedTransaction.cashier}</span>
                </div>
              </div>

              {/* Daftar item */}
              <div className="space-y-2 mb-3">
                {selectedTransaction.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Total dan metode pembayaran */}
              <div className="border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-bold">
                    {formatCurrency(selectedTransaction.total)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Payment Method</span>
                  <span className="capitalize">
                    {selectedTransaction.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Tombol tutup modal */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
