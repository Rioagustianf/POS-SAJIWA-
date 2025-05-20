"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  Filter,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/admin-layout";
import { format } from "date-fns";
import { exportToPDF } from "@/lib/exportToPdf";
import { formatCurrency } from "@/lib/utils";

// Komponen utama untuk halaman riwayat penjualan
export default function SalesHistory() {
  // State untuk menyimpan daftar transaksi penjualan
  const [transactions, setTransactions] = useState([]);
  // State untuk status loading (apakah data sedang diambil)
  const [isLoading, setIsLoading] = useState(true);
  // State untuk kata kunci pencarian
  const [searchTerm, setSearchTerm] = useState("");
  // State untuk rentang tanggal filter
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  // State untuk konfigurasi pengurutan data
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  // State untuk transaksi yang sedang diperluas detailnya
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  // State untuk filter metode pembayaran
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("");

  // useEffect untuk mengambil data transaksi saat pertama kali halaman dibuka
  useEffect(() => {
    fetchTransactions(); // Ambil data transaksi dari server
  }, []);

  // Fungsi untuk mengambil data transaksi dari server
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/transactions", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setTransactions(data); // Simpan data transaksi ke state
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Gagal memuat riwayat transaksi");
      setIsLoading(false);
    }
  };

  // Fungsi untuk menangani perubahan input pencarian
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Fungsi untuk menangani perubahan rentang tanggal
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value,
    });
  };

  // Fungsi untuk mengatur pengurutan data
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Fungsi untuk menampilkan/sembunyikan detail transaksi
  const toggleTransactionDetails = (id) => {
    if (expandedTransaction === id) {
      setExpandedTransaction(null);
    } else {
      setExpandedTransaction(id);
    }
  };

  // Fungsi untuk mengekspor data ke PDF
  const handleExportPDF = () => {
    try {
      // Panggil fungsi exportToPDF dengan data transaksi yang sudah difilter dan filter yang digunakan
      exportToPDF(filteredTransactions, {
        startDate: dateRange.start,
        endDate: dateRange.end,
        paymentMethod: filterPaymentMethod,
      });

      toast.success("Laporan PDF berhasil dibuat");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Gagal membuat laporan PDF");
    }
  };

  // Filter transaksi berdasarkan kata kunci pencarian, rentang tanggal, dan metode pembayaran
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.cashier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toString().includes(searchTerm) ||
      transaction.paymentMethod
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const transactionDate = new Date(transaction.date);
    const matchesDateRange =
      (!dateRange.start || transactionDate >= new Date(dateRange.start)) &&
      (!dateRange.end ||
        transactionDate <= new Date(`${dateRange.end}T23:59:59`));

    const matchesPaymentMethod =
      !filterPaymentMethod || transaction.paymentMethod === filterPaymentMethod;

    return matchesSearch && matchesDateRange && matchesPaymentMethod;
  });

  // Urutkan transaksi
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortConfig.key === "date") {
      return sortConfig.direction === "asc"
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    }
    if (sortConfig.key === "total") {
      return sortConfig.direction === "asc"
        ? a.total - b.total
        : b.total - a.total;
    }
    if (sortConfig.key === "id") {
      return sortConfig.direction === "asc" ? a.id - b.id : b.id - a.id;
    }
    // Untuk perbandingan string (cashier, paymentMethod)
    return sortConfig.direction === "asc"
      ? a[sortConfig.key].localeCompare(b[sortConfig.key])
      : b[sortConfig.key].localeCompare(a[sortConfig.key]);
  });

  // Ambil daftar metode pembayaran unik untuk filter
  const paymentMethods = [...new Set(transactions.map((t) => t.paymentMethod))];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold">Sales History</h1>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-9 pr-4 py-2 border border-input rounded-md w-full sm:w-64 bg-background"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors"
              >
                <FileDown className="h-4 w-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              name="start"
              value={dateRange.start}
              onChange={handleDateRangeChange}
              className="px-3 py-2 border border-input rounded-md bg-background w-full"
              placeholder="Start Date"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              name="end"
              value={dateRange.end}
              onChange={handleDateRangeChange}
              className="px-3 py-2 border border-input rounded-md bg-background w-full"
              placeholder="End Date"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background w-full"
            >
              <option value="">All Payment Methods</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">
                Loading transactions...
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th
                      className="px-4 py-3 text-left cursor-pointer"
                      onClick={() => handleSort("id")}
                    >
                      <div className="flex items-center gap-1">
                        ID
                        {sortConfig.key === "id" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left cursor-pointer"
                      onClick={() => handleSort("date")}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        {sortConfig.key === "date" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left cursor-pointer"
                      onClick={() => handleSort("cashier")}
                    >
                      <div className="flex items-center gap-1">
                        Cashier
                        {sortConfig.key === "cashier" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left cursor-pointer"
                      onClick={() => handleSort("total")}
                    >
                      <div className="flex items-center gap-1">
                        Total
                        {sortConfig.key === "total" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left cursor-pointer"
                      onClick={() => handleSort("paymentMethod")}
                    >
                      <div className="flex items-center gap-1">
                        Payment Method
                        {sortConfig.key === "paymentMethod" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.length > 0 ? (
                    sortedTransactions.map((transaction) => (
                      <>
                        <tr
                          key={transaction.id}
                          className="border-t border-border hover:bg-muted/50"
                        >
                          <td className="px-4 py-3 font-medium">
                            #{transaction.id}
                          </td>
                          <td className="px-4 py-3">
                            {format(
                              new Date(transaction.date),
                              "MMM d, yyyy h:mm a"
                            )}
                          </td>
                          <td className="px-4 py-3">{transaction.cashier}</td>
                          <td className="px-4 py-3 font-medium">
                            {formatCurrency(transaction.total)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                transaction.paymentMethod === "Cash"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : transaction.paymentMethod === "Credit Card"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                  : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                              }`}
                            >
                              {transaction.paymentMethod}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                toggleTransactionDetails(transaction.id)
                              }
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              {expandedTransaction === transaction.id
                                ? "Hide"
                                : "View"}{" "}
                              Details
                            </button>
                          </td>
                        </tr>
                        {expandedTransaction === transaction.id && (
                          <tr className="bg-muted/30">
                            <td colSpan="6" className="px-4 py-3">
                              <div className="rounded-md bg-card p-3 border border-border">
                                <h4 className="font-medium mb-2">
                                  Transaction Items
                                </h4>
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-border text-sm">
                                      <th className="px-3 py-2 text-left">
                                        Product
                                      </th>
                                      <th className="px-3 py-2 text-right">
                                        Quantity
                                      </th>
                                      <th className="px-3 py-2 text-right">
                                        Subtotal
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {transaction.items.map((item) => (
                                      <tr
                                        key={item.id}
                                        className="border-b border-border/50 last:border-0"
                                      >
                                        <td className="px-3 py-2 text-left">
                                          {item.name}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          {item.quantity}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          {formatCurrency(item.subtotal)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="font-medium">
                                      <td
                                        className="px-3 py-2 text-left"
                                        colSpan="2"
                                      >
                                        Total
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        {formatCurrency(transaction.total)}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))
                  ) : (
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
      </div>
    </AdminLayout>
  );
}
