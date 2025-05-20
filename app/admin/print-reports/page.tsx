"use client";

import { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Calendar,
  Download,
  FileText,
  Loader2,
  ArrowLeft,
  Printer,
  TrendingUp,
  BarChart3,
  PieChartIcon,
  AlertTriangle,
} from "lucide-react";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  differenceInDays,
} from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function PrintReports() {
  // Membuat state untuk menyimpan rentang tanggal yang dipilih user
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), "yyyy-MM-dd"), // Tanggal mulai default: 30 hari lalu
    end: format(new Date(), "yyyy-MM-dd"), // Tanggal akhir default: hari ini
  });
  // Membuat state untuk menyimpan tipe laporan yang dipilih user
  const [reportType, setReportType] = useState("sales"); // Default: laporan penjualan
  // Membuat state untuk menyimpan data laporan yang diambil dari server
  const [reportData, setReportData] = useState<any>(null);
  // Membuat state untuk menandai apakah sedang loading
  const [isLoading, setIsLoading] = useState(false);
  // Membuat state untuk menyimpan data perbandingan (periode sebelumnya)
  const [comparisonData, setComparisonData] = useState<any>(null);
  // Membuat state untuk menandai apakah perbandingan aktif
  const [showComparison, setShowComparison] = useState(false);
  // Membuat state untuk menyimpan pesan error
  const [error, setError] = useState<string | null>(null);
  // State berikut tidak digunakan, hanya dummy
  const [userRole, setUserRole] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  // Membuat ref untuk elemen yang akan diprint (tidak digunakan di kode ini)
  const printRef = useRef(null);
  // Membuat router untuk navigasi programatik
  const router = useRouter();

  // useEffect akan dijalankan setiap kali dateRange, reportType, atau showComparison berubah
  useEffect(() => {
    fetchReportData(); // Ambil data laporan utama dari server
    if (showComparison) {
      // Jika perbandingan aktif
      fetchComparisonData(); // Ambil data perbandingan dari server
    }
  }, [dateRange, reportType, showComparison]); // Dependency array: jalankan ulang jika salah satu berubah

  // Fungsi untuk mengambil data laporan dari server
  const fetchReportData = async () => {
    try {
      setIsLoading(true); // Set loading menjadi true agar muncul animasi loading
      setError(null); // Reset pesan error menjadi null

      // Membuat query parameter dari tanggal yang dipilih user
      const queryParams = new URLSearchParams({
        startDate: dateRange.start, // Tanggal mulai diambil dari state dateRange
        endDate: dateRange.end, // Tanggal akhir diambil dari state dateRange
      });

      // Mengambil data laporan dari endpoint API dengan query parameter
      const response = await fetch(`/api/reports/sales?${queryParams}`);

      // Jika response dari server tidak sukses (bukan 200 OK)
      if (!response.ok) {
        // Lempar error dengan pesan status dari server
        throw new Error(
          `Gagal mengambil data laporan: ${response.status} ${response.statusText}`
        );
      }

      // Mengubah response dari server menjadi data JSON
      const data = await response.json();

      // Jika data penjualan ada dan jumlahnya lebih dari 0
      if (data.salesData && data.salesData.length > 0) {
        // Hitung jumlah hari dalam periode yang dipilih user
        const totalDays =
          differenceInDays(new Date(dateRange.end), new Date(dateRange.start)) +
          1;
        // Hitung titik tengah periode (untuk membagi dua periode)
        const midPoint = Math.floor(totalDays / 2);

        // Ambil data penjualan setengah periode pertama
        const firstHalfData = data.salesData.slice(0, midPoint);
        // Ambil data penjualan setengah periode kedua
        const secondHalfData = data.salesData.slice(midPoint);

        // Hitung total penjualan pada setengah periode pertama
        const firstHalfSales = firstHalfData.reduce(
          (sum: number, item: any) => sum + item.sales,
          0
        );
        // Hitung total penjualan pada setengah periode kedua
        const secondHalfSales = secondHalfData.reduce(
          (sum: number, item: any) => sum + item.sales,
          0
        );

        // Hitung persentase pertumbuhan penjualan antar setengah periode
        const growthRate =
          firstHalfSales > 0
            ? (
                ((secondHalfSales - firstHalfSales) / firstHalfSales) *
                100
              ).toFixed(2)
            : 0;

        // Hitung rata-rata penjualan harian selama periode
        const dailyAverage = data.summary.totalSales / totalDays;

        // Simpan nilai pertumbuhan ke dalam data summary
        data.summary.growthRate = Number.parseFloat(growthRate as string);
        // Simpan rata-rata harian ke dalam data summary
        data.summary.dailyAverage = dailyAverage;
        // Simpan jumlah hari ke dalam data summary
        data.summary.periodLength = totalDays;
      }

      setReportData(data); // Simpan data laporan ke state reportData
    } catch (error: any) {
      console.error("Error fetching report data:", error); // Tampilkan error di konsol
      setError(error.message); // Simpan pesan error ke state error
    } finally {
      setIsLoading(false); // Set status loading menjadi false agar loading hilang
    }
  };

  // Fungsi untuk mengambil data perbandingan (periode sebelumnya)
  const fetchComparisonData = async () => {
    try {
      // Hitung periode sebelumnya dengan panjang yang sama
      const currentStartDate = new Date(dateRange.start); // Tanggal mulai periode sekarang
      const currentEndDate = new Date(dateRange.end); // Tanggal akhir periode sekarang
      const periodLength =
        differenceInDays(currentEndDate, currentStartDate) + 1; // Panjang periode

      // Tentukan tanggal mulai dan akhir periode sebelumnya
      const previousEndDate = subDays(currentStartDate, 1); // Satu hari sebelum periode sekarang
      const previousStartDate = subDays(previousEndDate, periodLength - 1); // Mundur sesuai panjang periode

      // Buat query parameter untuk periode sebelumnya
      const queryParams = new URLSearchParams({
        startDate: format(previousStartDate, "yyyy-MM-dd"), // Format tanggal mulai
        endDate: format(previousEndDate, "yyyy-MM-dd"), // Format tanggal akhir
      });

      // Ambil data perbandingan dari API
      const response = await fetch(`/api/reports/sales?${queryParams}`);

      // Jika response tidak sukses, lempar error
      if (!response.ok) {
        throw new Error("Gagal mengambil data perbandingan");
      }

      // Ubah response ke JSON
      const data = await response.json();

      // Hitung rata-rata harian dan simpan ke summary jika ada data
      if (data.salesData && data.salesData.length > 0) {
        const totalDays =
          differenceInDays(previousEndDate, previousStartDate) + 1;
        const dailyAverage = data.summary.totalSales / totalDays;
        data.summary.periodLength = totalDays;
        data.summary.dailyAverage = dailyAverage;
      }

      setComparisonData(data); // Simpan data perbandingan ke state
    } catch (error) {
      console.error("Error fetching comparison data:", error); // Tampilkan error di konsol
    }
  };

  // Fungsi untuk mengubah tanggal mulai
  const handleStartDateChange = (e: any) => {
    setDateRange({
      ...dateRange, // Salin data dateRange sebelumnya
      start: e.target.value, // Ubah tanggal mulai sesuai input user
    });
  };

  // Fungsi untuk mengubah tanggal akhir
  const handleEndDateChange = (e: any) => {
    setDateRange({
      ...dateRange, // Salin data dateRange sebelumnya
      end: e.target.value, // Ubah tanggal akhir sesuai input user
    });
  };

  // Fungsi untuk mengubah tipe laporan (penjualan, produk, kategori)
  const handleReportTypeChange = (type: any) => {
    setReportType(type); // Ubah tipe laporan sesuai pilihan user
  };

  // Fungsi untuk memilih rentang tanggal cepat (hari ini, kemarin, minggu, bulan, dst)
  const handleQuickDateRange = (range: any) => {
    const today = new Date(); // Ambil tanggal hari ini

    switch (
      range // Pilih aksi sesuai range yang dipilih user
    ) {
      case "today":
        setDateRange({
          start: format(today, "yyyy-MM-dd"), // Set tanggal mulai hari ini
          end: format(today, "yyyy-MM-dd"), // Set tanggal akhir hari ini
        });
        break;
      case "yesterday":
        const yesterday = subDays(today, 1); // Ambil tanggal kemarin
        setDateRange({
          start: format(yesterday, "yyyy-MM-dd"), // Set tanggal mulai kemarin
          end: format(yesterday, "yyyy-MM-dd"), // Set tanggal akhir kemarin
        });
        break;
      case "week":
        setDateRange({
          start: format(subDays(today, 7), "yyyy-MM-dd"), // 7 hari lalu
          end: format(today, "yyyy-MM-dd"), // hari ini
        });
        break;
      case "month":
        setDateRange({
          start: format(startOfMonth(today), "yyyy-MM-dd"), // Awal bulan ini
          end: format(endOfMonth(today), "yyyy-MM-dd"), // Akhir bulan ini
        });
        break;
      case "30days":
        setDateRange({
          start: format(subDays(today, 30), "yyyy-MM-dd"), // 30 hari lalu
          end: format(today, "yyyy-MM-dd"), // hari ini
        });
        break;
      case "90days":
        setDateRange({
          start: format(subDays(today, 90), "yyyy-MM-dd"), // 90 hari lalu
          end: format(today, "yyyy-MM-dd"), // hari ini
        });
        break;
      default:
        break;
    }
  };

  // Fungsi untuk mengekspor laporan ke PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF(); // Inisialisasi dokumen PDF baru

      doc.setFontSize(18); // Set ukuran font judul
      doc.text("Sajiwa Steak Restaurant", 105, 15, { align: "center" }); // Tulis nama restoran di tengah

      doc.setFontSize(14); // Set ukuran font subjudul
      let reportTitle = ""; // Variabel untuk judul laporan
      if (reportType === "sales") reportTitle = "Laporan Penjualan Manajerial"; // Judul jika tipe sales
      if (reportType === "products") reportTitle = "Laporan Produk Manajerial"; // Judul jika tipe produk
      if (reportType === "categories")
        reportTitle = "Laporan Kategori Manajerial"; // Judul jika tipe kategori
      doc.text(reportTitle, 105, 25, { align: "center" }); // Tulis judul di tengah

      doc.setFontSize(10); // Set ukuran font kecil
      doc.text(
        `Periode: ${format(new Date(dateRange.start), "d MMMM yyyy", {
          locale: id,
        })} hingga ${format(new Date(dateRange.end), "d MMMM yyyy", {
          locale: id,
        })}`,
        105,
        35,
        { align: "center" }
      ); // Tulis periode laporan

      doc.text(
        `Dibuat pada: ${format(new Date(), "d MMMM yyyy HH:mm", {
          locale: id,
        })}`,
        105,
        42,
        { align: "center" }
      ); // Tulis tanggal pembuatan laporan

      doc.setFontSize(12); // Set ukuran font untuk ringkasan
      doc.text("Ringkasan", 14, 55); // Tulis judul ringkasan

      if (reportType === "sales") {
        // Jika tipe laporan sales
        const formatCurrency = (value: any) => {
          return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(value);
        };

        const summaryData = [
          ["Total Penjualan", formatCurrency(reportData.summary.totalSales)],
          ["Total Pesanan", reportData.summary.totalOrders.toString()],
          [
            "Rata-rata Nilai Pesanan",
            formatCurrency(reportData.summary.averageSale),
          ],
          [
            "Rata-rata Penjualan Harian",
            formatCurrency(reportData.summary.dailyAverage),
          ],
          ["Pertumbuhan", `${reportData.summary.growthRate}%`],
          [
            "Rata-rata Pesanan per Hari",
            (
              reportData.summary.totalOrders / reportData.summary.periodLength
            ).toFixed(1),
          ],
        ];

        autoTable(doc, {
          startY: 60,
          head: [["Metrik", "Nilai"]],
          body: summaryData,
          theme: "grid",
          headStyles: { fillColor: [66, 66, 66] },
        }); // Buat tabel ringkasan
      }

      const startY = reportType === "sales" ? 130 : 60; // Posisi awal tabel detail
      doc.setFontSize(12); // Set ukuran font untuk data detail
      doc.text("Data Detail", 14, startY - 5); // Tulis judul data detail

      if (reportType === "sales") {
        const tableData = reportData.salesData.map((item: any) => [
          item.date,
          new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(item.sales),
          item.orders.toString(),
          new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(item.orders > 0 ? item.sales / item.orders : 0),
        ]);

        autoTable(doc, {
          startY: startY,
          head: [["Tanggal", "Penjualan", "Pesanan", "Rata-rata"]],
          body: tableData,
          theme: "grid",
          headStyles: { fillColor: [66, 66, 66] },
        }); // Buat tabel data detail penjualan
      } else if (reportType === "products") {
        const tableData = reportData.topProducts.map((item: any) => {
          const totalQuantity = reportData.topProducts.reduce(
            (sum: number, i: any) => sum + i.quantity,
            0
          );
          const percentage = ((item.quantity / totalQuantity) * 100).toFixed(1);

          return [
            item.name,
            item.quantity.toString(),
            new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(item.revenue),
            `${percentage}%`,
          ];
        });

        autoTable(doc, {
          startY: startY,
          head: [["Produk", "Jumlah Terjual", "Pendapatan", "% dari Total"]],
          body: tableData,
          theme: "grid",
          headStyles: { fillColor: [66, 66, 66] },
        }); // Buat tabel data detail produk
      } else if (reportType === "categories") {
        const tableData = reportData.categoryData.map((item: any) => {
          const totalQuantity = reportData.categoryData.reduce(
            (sum: number, i: any) => sum + i.quantity,
            0
          );
          const percentage = ((item.quantity / totalQuantity) * 100).toFixed(1);

          return [
            item.name,
            item.quantity.toString(),
            new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(item.revenue),
            `${percentage}%`,
          ];
        });

        autoTable(doc, {
          startY: startY,
          head: [["Kategori", "Jumlah Terjual", "Pendapatan", "% dari Total"]],
          body: tableData,
          theme: "grid",
          headStyles: { fillColor: [66, 66, 66] },
        }); // Buat tabel data detail kategori
      }

      // Tambahkan footer pada setiap halaman PDF
      const pageCount = (doc as any).internal.getNumberOfPages(); // Ambil jumlah halaman
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i); // Pindah ke halaman ke-i
        doc.setFontSize(10); // Set ukuran font kecil
        doc.text(
          `Sajiwa Steak Restaurant - ${format(new Date(), "yyyy")}`,
          105,
          (doc as any).internal.pageSize.height - 20,
          { align: "center" }
        ); // Nama restoran di footer
        doc.text(
          "Laporan ini dibuat secara otomatis oleh sistem",
          105,
          (doc as any).internal.pageSize.height - 15,
          { align: "center" }
        ); // Info sistem di footer
        doc.text(
          `Halaman ${i} dari ${pageCount}`,
          (doc as any).internal.pageSize.width - 20,
          (doc as any).internal.pageSize.height - 10
        ); // Nomor halaman
      }

      doc.save(
        `laporan_manajerial_${reportType}_${dateRange.start}_${dateRange.end}.pdf`
      ); // Simpan file PDF
    } catch (error) {
      console.error("Error exporting to PDF:", error); // Tampilkan error di konsol
      alert("Terjadi kesalahan saat mengekspor PDF. Silakan coba lagi."); // Tampilkan pesan error ke user
    }
  };

  // Fungsi untuk memformat angka ke format mata uang Rupiah
  const formatCurrency = (value: any) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Fungsi untuk menghitung persentase perubahan antara dua nilai
  const calculateChange = (current: any, previous: any) => {
    if (!previous || previous === 0) return { value: 0, isPositive: true }; // Jika data sebelumnya 0, return 0
    const change = ((current - previous) / previous) * 100; // Hitung persentase perubahan
    return {
      value: Math.abs(change).toFixed(1), // Nilai absolut perubahan
      isPositive: change >= 0, // True jika perubahan positif
    };
  };

  // Warna-warna untuk grafik
  const COLORS = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#8AC249",
    "#EA80FC",
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 print:space-y-4">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Laporan Manajerial</h1>
          </div>
          <div className="flex gap-2">
            {reportData && (
              <Button
                onClick={exportToPDF}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            )}
          </div>
        </div>

        <div className="hidden print:block print:mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Sajiwa Steak Restaurant</h1>
            <h2 className="text-xl font-semibold mt-1">
              {reportType === "sales" && "Laporan Penjualan Manajerial"}
              {reportType === "products" && "Laporan Produk Manajerial"}
              {reportType === "categories" && "Laporan Kategori Manajerial"}
            </h2>
            <p className="text-muted-foreground mt-1">
              Periode:{" "}
              {format(new Date(dateRange.start), "d MMMM yyyy", { locale: id })}{" "}
              hingga{" "}
              {format(new Date(dateRange.end), "d MMMM yyyy", { locale: id })}
            </p>
            <p className="text-muted-foreground mt-1">
              Dibuat pada:{" "}
              {format(new Date(), "d MMMM yyyy HH:mm", { locale: id })}
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="print:hidden border-green-200 shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Rentang Tanggal</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={handleStartDateChange}
                      className="pl-9 pr-4 py-2 border border-input rounded-md w-full bg-background"
                    />
                  </div>
                  <span className="hidden sm:flex items-center">hingga</span>
                  <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={handleEndDateChange}
                      className="pl-9 pr-4 py-2 border border-input rounded-md w-full bg-background"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Pilihan Cepat</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleQuickDateRange("today")}
                    variant="outline"
                    size="sm"
                  >
                    Hari Ini
                  </Button>
                  <Button
                    onClick={() => handleQuickDateRange("yesterday")}
                    variant="outline"
                    size="sm"
                  >
                    Kemarin
                  </Button>
                  <Button
                    onClick={() => handleQuickDateRange("week")}
                    variant="outline"
                    size="sm"
                  >
                    7 Hari Terakhir
                  </Button>
                  <Button
                    onClick={() => handleQuickDateRange("month")}
                    variant="outline"
                    size="sm"
                  >
                    Bulan Ini
                  </Button>
                  <Button
                    onClick={() => handleQuickDateRange("30days")}
                    variant="outline"
                    size="sm"
                  >
                    30 Hari Terakhir
                  </Button>
                  <Button
                    onClick={() => handleQuickDateRange("90days")}
                    variant="outline"
                    size="sm"
                  >
                    90 Hari Terakhir
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleReportTypeChange("sales")}
                  variant={reportType === "sales" ? "default" : "outline"}
                  className={
                    reportType === "sales"
                      ? "bg-green-600 hover:bg-green-700"
                      : ""
                  }
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Laporan Penjualan
                </Button>
                <Button
                  onClick={() => handleReportTypeChange("products")}
                  variant={reportType === "products" ? "default" : "outline"}
                  className={
                    reportType === "products"
                      ? "bg-green-600 hover:bg-green-700"
                      : ""
                  }
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Laporan Produk
                </Button>
                <Button
                  onClick={() => handleReportTypeChange("categories")}
                  variant={reportType === "categories" ? "default" : "outline"}
                  className={
                    reportType === "categories"
                      ? "bg-green-600 hover:bg-green-700"
                      : ""
                  }
                >
                  <PieChartIcon className="h-4 w-4 mr-2" />
                  Laporan Kategori
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm">
                  Bandingkan dengan periode sebelumnya
                </label>
                <input
                  type="checkbox"
                  checked={showComparison}
                  onChange={(e) => setShowComparison(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div ref={printRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-64 print:hidden">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Memuat data laporan...</p>
              </div>
            </div>
          ) : reportData ? (
            <>
              {reportType === "sales" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
                  <Card className="border-green-200 shadow-md">
                    <CardHeader className="pb-2 bg-green-50">
                      <CardTitle className="text-sm font-medium text-green-800">
                        Total Penjualan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(reportData.summary.totalSales)}
                      </p>
                      {showComparison && comparisonData && (
                        <div className="flex items-center mt-1">
                          <p className="text-xs">
                            vs periode sebelumnya:{" "}
                            {formatCurrency(comparisonData.summary.totalSales)}
                          </p>
                          {(() => {
                            const change = calculateChange(
                              reportData.summary.totalSales,
                              comparisonData.summary.totalSales
                            );
                            return (
                              <span
                                className={`ml-2 text-xs ${
                                  change.isPositive
                                    ? "text-green-500"
                                    : "text-red-500"
                                }`}
                              >
                                {change.isPositive ? "↑" : "↓"} {change.value}%
                              </span>
                            );
                          })()}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {dateRange.start === dateRange.end
                          ? `pada ${format(
                              new Date(dateRange.start),
                              "d MMMM yyyy",
                              { locale: id }
                            )}`
                          : `dari ${format(
                              new Date(dateRange.start),
                              "d MMMM yyyy",
                              { locale: id }
                            )} hingga ${format(
                              new Date(dateRange.end),
                              "d MMMM yyyy",
                              { locale: id }
                            )}`}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 shadow-md">
                    <CardHeader className="pb-2 bg-green-50">
                      <CardTitle className="text-sm font-medium text-green-800">
                        Total Pesanan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-700">
                        {reportData.summary.totalOrders}
                      </p>
                      {showComparison && comparisonData && (
                        <div className="flex items-center mt-1">
                          <p className="text-xs">
                            vs periode sebelumnya:{" "}
                            {comparisonData.summary.totalOrders}
                          </p>
                          {(() => {
                            const change = calculateChange(
                              reportData.summary.totalOrders,
                              comparisonData.summary.totalOrders
                            );
                            return (
                              <span
                                className={`ml-2 text-xs ${
                                  change.isPositive
                                    ? "text-green-500"
                                    : "text-red-500"
                                }`}
                              >
                                {change.isPositive ? "↑" : "↓"} {change.value}%
                              </span>
                            );
                          })()}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {reportData.salesData.length} hari
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 shadow-md">
                    <CardHeader className="pb-2 bg-green-50">
                      <CardTitle className="text-sm font-medium text-green-800">
                        Rata-rata Nilai Pesanan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(reportData.summary.averageSale)}
                      </p>
                      {showComparison && comparisonData && (
                        <div className="flex items-center mt-1">
                          <p className="text-xs">
                            vs periode sebelumnya:{" "}
                            {formatCurrency(comparisonData.summary.averageSale)}
                          </p>
                          {(() => {
                            const change = calculateChange(
                              reportData.summary.averageSale,
                              comparisonData.summary.averageSale
                            );
                            return (
                              <span
                                className={`ml-2 text-xs ${
                                  change.isPositive
                                    ? "text-green-500"
                                    : "text-red-500"
                                }`}
                              >
                                {change.isPositive ? "↑" : "↓"} {change.value}%
                              </span>
                            );
                          })()}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Per transaksi
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {reportType === "sales" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 mt-4">
                  <Card className="border-green-200 shadow-md">
                    <CardHeader className="pb-2 bg-green-50">
                      <CardTitle className="text-sm font-medium text-green-800">
                        Rata-rata Penjualan Harian
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(reportData.summary.dailyAverage)}
                      </p>
                      {showComparison && comparisonData && (
                        <div className="flex items-center mt-1">
                          <p className="text-xs">
                            vs periode sebelumnya:{" "}
                            {formatCurrency(
                              comparisonData.summary.totalSales /
                                comparisonData.salesData.length
                            )}
                          </p>
                          {(() => {
                            const prevDailyAvg =
                              comparisonData.summary.totalSales /
                              comparisonData.salesData.length;
                            const change = calculateChange(
                              reportData.summary.dailyAverage,
                              prevDailyAvg
                            );
                            return (
                              <span
                                className={`ml-2 text-xs ${
                                  change.isPositive
                                    ? "text-green-500"
                                    : "text-red-500"
                                }`}
                              >
                                {change.isPositive ? "↑" : "↓"} {change.value}%
                              </span>
                            );
                          })()}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Selama {reportData.summary.periodLength} hari
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 shadow-md">
                    <CardHeader className="pb-2 bg-green-50">
                      <CardTitle className="text-sm font-medium text-green-800">
                        Pertumbuhan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p
                        className={`text-2xl font-bold ${
                          reportData.summary.growthRate >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {reportData.summary.growthRate >= 0 ? "+" : ""}
                        {reportData.summary.growthRate}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dibandingkan paruh pertama periode
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 shadow-md">
                    <CardHeader className="pb-2 bg-green-50">
                      <CardTitle className="text-sm font-medium text-green-800">
                        Rata-rata Pesanan per Hari
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-700">
                        {(
                          reportData.summary.totalOrders /
                          reportData.summary.periodLength
                        ).toFixed(1)}
                      </p>
                      {showComparison && comparisonData && (
                        <div className="flex items-center mt-1">
                          <p className="text-xs">
                            vs periode sebelumnya:{" "}
                            {(
                              comparisonData.summary.totalOrders /
                              comparisonData.salesData.length
                            ).toFixed(1)}
                          </p>
                          {(() => {
                            const currOrdersPerDay =
                              reportData.summary.totalOrders /
                              reportData.summary.periodLength;
                            const prevOrdersPerDay =
                              comparisonData.summary.totalOrders /
                              comparisonData.salesData.length;
                            const change = calculateChange(
                              currOrdersPerDay,
                              prevOrdersPerDay
                            );
                            return (
                              <span
                                className={`ml-2 text-xs ${
                                  change.isPositive
                                    ? "text-green-500"
                                    : "text-red-500"
                                }`}
                              >
                                {change.isPositive ? "↑" : "↓"} {change.value}%
                              </span>
                            );
                          })()}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Transaksi per hari
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Tabs defaultValue="trend" className="mt-6 print:mt-4">
                <TabsList className="print:hidden">
                  <TabsTrigger value="trend">Tren</TabsTrigger>
                  <TabsTrigger value="comparison">Perbandingan</TabsTrigger>
                  {reportType === "sales" && (
                    <TabsTrigger value="cumulative">Kumulatif</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="trend">
                  <Card className="border-green-200 shadow-md">
                    <CardHeader className="pb-2 bg-green-50">
                      <CardTitle>
                        {reportType === "sales" && "Tren Penjualan"}
                        {reportType === "products" && "Produk Terlaris"}
                        {reportType === "categories" &&
                          "Penjualan per Kategori"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reportType === "sales" && (
                        <div className="h-80 print:h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={reportData.salesData}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis
                                tickFormatter={(value) =>
                                  new Intl.NumberFormat("id-ID", {
                                    notation: "compact",
                                    compactDisplay: "short",
                                    currency: "IDR",
                                  }).format(value)
                                }
                              />
                              <Tooltip
                                formatter={(value) => [
                                  formatCurrency(value),
                                  "Penjualan",
                                ]}
                                labelFormatter={(label) => `Tanggal: ${label}`}
                              />
                              <Line
                                type="monotone"
                                dataKey="sales"
                                stroke="#22c55e"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                                name="Penjualan"
                              />
                              {showComparison && comparisonData && (
                                <Line
                                  type="monotone"
                                  dataKey="sales"
                                  stroke="#3b82f6"
                                  strokeWidth={2}
                                  strokeDasharray="5 5"
                                  dot={{ r: 4 }}
                                  data={comparisonData.salesData}
                                  name="Periode Sebelumnya"
                                />
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {reportType === "products" && (
                        <div className="h-80 print:h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={reportData.topProducts}
                              layout="vertical"
                              margin={{
                                top: 20,
                                right: 30,
                                left: 100,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                              />
                              <Tooltip
                                formatter={(value) => [
                                  `${value} pesanan`,
                                  "Jumlah",
                                ]}
                              />
                              <Bar
                                dataKey="quantity"
                                fill="#22c55e"
                                name="Jumlah Terjual"
                              >
                                {reportData.topProducts.map(
                                  (entry: any, index: any) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  )
                                )}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {reportType === "categories" && (
                        <div className="h-80 print:h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={reportData.categoryData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="quantity"
                                label={({ name, percent }) =>
                                  `${name} ${(percent * 100).toFixed(0)}%`
                                }
                              >
                                {reportData.categoryData.map(
                                  (entry: any, index: any) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  )
                                )}
                              </Pie>
                              <Tooltip
                                formatter={(value) => [
                                  `${value} pesanan`,
                                  "Jumlah",
                                ]}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="comparison">
                  <Card className="border-green-200 shadow-md">
                    <CardHeader className="pb-2 bg-green-50">
                      <CardTitle>
                        {reportType === "sales" && "Perbandingan Penjualan"}
                        {reportType === "products" &&
                          "Perbandingan Pendapatan Produk"}
                        {reportType === "categories" &&
                          "Perbandingan Pendapatan Kategori"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reportType === "sales" && (
                        <div className="h-80 print:h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={reportData.salesData}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis
                                tickFormatter={(value) =>
                                  new Intl.NumberFormat("id-ID", {
                                    notation: "compact",
                                    compactDisplay: "short",
                                    currency: "IDR",
                                  }).format(value)
                                }
                              />
                              <Tooltip
                                formatter={(value) => [
                                  formatCurrency(value),
                                  "Penjualan",
                                ]}
                                labelFormatter={(label) => `Tanggal: ${label}`}
                              />
                              <Bar
                                dataKey="sales"
                                fill="#22c55e"
                                name="Penjualan"
                              />
                              <Bar
                                dataKey="orders"
                                fill="#3b82f6"
                                name="Jumlah Pesanan"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {reportType === "products" && (
                        <div className="h-80 print:h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={reportData.topProducts}
                              layout="vertical"
                              margin={{
                                top: 20,
                                right: 30,
                                left: 100,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                type="number"
                                tickFormatter={(value) =>
                                  new Intl.NumberFormat("id-ID", {
                                    notation: "compact",
                                    compactDisplay: "short",
                                    currency: "IDR",
                                  }).format(value)
                                }
                              />
                              <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                              />
                              <Tooltip
                                formatter={(value, name) => [
                                  name === "revenue"
                                    ? formatCurrency(value)
                                    : value,
                                  name === "revenue" ? "Pendapatan" : "Jumlah",
                                ]}
                              />
                              <Bar
                                dataKey="revenue"
                                fill="#22c55e"
                                name="Pendapatan"
                              />
                              <Bar
                                dataKey="quantity"
                                fill="#3b82f6"
                                name="Jumlah Terjual"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {reportType === "categories" && (
                        <div className="h-80 print:h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={reportData.categoryData}
                              layout="vertical"
                              margin={{
                                top: 20,
                                right: 30,
                                left: 100,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                type="number"
                                tickFormatter={(value) =>
                                  new Intl.NumberFormat("id-ID", {
                                    notation: "compact",
                                    compactDisplay: "short",
                                    currency: "IDR",
                                  }).format(value)
                                }
                              />
                              <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                              />
                              <Tooltip
                                formatter={(value, name) => [
                                  name === "revenue"
                                    ? formatCurrency(value)
                                    : value,
                                  name === "revenue" ? "Pendapatan" : "Jumlah",
                                ]}
                              />
                              <Bar
                                dataKey="revenue"
                                fill="#22c55e"
                                name="Pendapatan"
                              />
                              <Bar
                                dataKey="quantity"
                                fill="#3b82f6"
                                name="Jumlah Terjual"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="cumulative">
                  <Card className="border-green-200 shadow-md">
                    <CardHeader className="pb-2 bg-green-50">
                      <CardTitle>Penjualan Kumulatif</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80 print:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={(() => {
                              let cumulativeTotal = 0;
                              return reportData.salesData.map((item: any) => {
                                cumulativeTotal += item.sales;
                                return {
                                  ...item,
                                  cumulativeSales: cumulativeTotal,
                                };
                              });
                            })()}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis
                              tickFormatter={(value) =>
                                new Intl.NumberFormat("id-ID", {
                                  notation: "compact",
                                  compactDisplay: "short",
                                  currency: "IDR",
                                }).format(value)
                              }
                            />
                            <Tooltip
                              formatter={(value) => [
                                formatCurrency(value),
                                "Penjualan Kumulatif",
                              ]}
                              labelFormatter={(label) => `Tanggal: ${label}`}
                            />
                            <Area
                              type="monotone"
                              dataKey="cumulativeSales"
                              stroke="#22c55e"
                              fill="#22c55e"
                              fillOpacity={0.3}
                              name="Penjualan Kumulatif"
                            />
                            {showComparison &&
                              comparisonData &&
                              (() => {
                                let cumulativeTotal = 0;
                                const cumulativeComparisonData =
                                  comparisonData.salesData.map((item: any) => {
                                    cumulativeTotal += item.sales;
                                    return {
                                      ...item,
                                      cumulativeSales: cumulativeTotal,
                                    };
                                  });

                                return (
                                  <Area
                                    type="monotone"
                                    dataKey="cumulativeSales"
                                    stroke="#3b82f6"
                                    fill="#3b82f6"
                                    fillOpacity={0.3}
                                    strokeDasharray="5 5"
                                    name="Periode Sebelumnya"
                                    data={cumulativeComparisonData}
                                  />
                                );
                              })()}
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Card className="print:mt-4 border-green-200 shadow-md">
                <CardHeader className="pb-2 bg-green-50">
                  <CardTitle>Data Detail</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    {reportType === "sales" && (
                      <table className="w-full">
                        <thead>
                          <tr className="bg-green-100">
                            <th className="px-4 py-3 text-left text-green-800">
                              Tanggal
                            </th>
                            <th className="px-4 py-3 text-left text-green-800">
                              Penjualan
                            </th>
                            <th className="px-4 py-3 text-left text-green-800">
                              Pesanan
                            </th>
                            <th className="px-4 py-3 text-left text-green-800">
                              Rata-rata Nilai Pesanan
                            </th>
                            {showComparison && comparisonData && (
                              <>
                                <th className="px-4 py-3 text-left text-green-800">
                                  Penjualan (Periode Sebelumnya)
                                </th>
                                <th className="px-4 py-3 text-left text-green-800">
                                  Perubahan
                                </th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.salesData.map((item: any, index: any) => {
                            let comparisonItem = null;
                            if (showComparison && comparisonData) {
                              const comparisonIndex =
                                comparisonData.salesData.length -
                                reportData.salesData.length +
                                index;
                              if (
                                comparisonIndex >= 0 &&
                                comparisonIndex <
                                  comparisonData.salesData.length
                              ) {
                                comparisonItem =
                                  comparisonData.salesData[comparisonIndex];
                              }
                            }

                            return (
                              <tr
                                key={index}
                                className="border-t border-green-100 hover:bg-green-50"
                              >
                                <td className="px-4 py-3">{item.date}</td>
                                <td className="px-4 py-3 font-medium">
                                  {formatCurrency(item.sales)}
                                </td>
                                <td className="px-4 py-3">{item.orders}</td>
                                <td className="px-4 py-3">
                                  {formatCurrency(
                                    item.orders > 0
                                      ? item.sales / item.orders
                                      : 0
                                  )}
                                </td>
                                {showComparison && comparisonData && (
                                  <>
                                    <td className="px-4 py-3">
                                      {comparisonItem
                                        ? formatCurrency(comparisonItem.sales)
                                        : "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                      {comparisonItem
                                        ? (() => {
                                            const change = calculateChange(
                                              item.sales,
                                              comparisonItem.sales
                                            );
                                            return (
                                              <span
                                                className={
                                                  change.isPositive
                                                    ? "text-green-500"
                                                    : "text-red-500"
                                                }
                                              >
                                                {change.isPositive ? "↑" : "↓"}{" "}
                                                {change.value}%
                                              </span>
                                            );
                                          })()
                                        : "-"}
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}

                    {reportType === "products" && (
                      <table className="w-full">
                        <thead>
                          <tr className="bg-green-100">
                            <th className="px-4 py-3 text-left text-green-800">
                              Produk
                            </th>
                            <th className="px-4 py-3 text-left text-green-800">
                              Jumlah Terjual
                            </th>
                            <th className="px-4 py-3 text-left text-green-800">
                              Pendapatan
                            </th>
                            <th className="px-4 py-3 text-left text-green-800">
                              % dari Total
                            </th>
                            <th className="px-4 py-3 text-left text-green-800">
                              Rata-rata Harga
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.topProducts.map(
                            (item: any, index: any) => {
                              const totalQuantity =
                                reportData.topProducts.reduce(
                                  (sum: number, i: any) => sum + i.quantity,
                                  0
                                );
                              const percentage = (
                                (item.quantity / totalQuantity) *
                                100
                              ).toFixed(1);
                              const avgPrice =
                                item.quantity > 0
                                  ? item.revenue / item.quantity
                                  : 0;

                              return (
                                <tr
                                  key={index}
                                  className="border-t border-green-100 hover:bg-green-50"
                                >
                                  <td className="px-4 py-3 font-medium">
                                    {item.name}
                                  </td>
                                  <td className="px-4 py-3">{item.quantity}</td>
                                  <td className="px-4 py-3">
                                    {formatCurrency(item.revenue)}
                                  </td>
                                  <td className="px-4 py-3">{percentage}%</td>
                                  <td className="px-4 py-3">
                                    {formatCurrency(avgPrice)}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    )}

                    {reportType === "categories" && (
                      <table className="w-full">
                        <thead>
                          <tr className="bg-green-100">
                            <th className="px-4 py-3 text-left text-green-800">
                              Kategori
                            </th>
                            <th className="px-4 py-3 text-left text-green-800">
                              Jumlah Terjual
                            </th>
                            <th className="px-4 py-3 text-left text-green-800">
                              Pendapatan
                            </th>
                            <th className="px-4 py-3 text-left text-green-800">
                              % dari Total
                            </th>
                            <th className="px-4 py-3 text-left text-green-800">
                              Rata-rata per Item
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.categoryData.map(
                            (item: any, index: any) => {
                              const totalQuantity =
                                reportData.categoryData.reduce(
                                  (sum: number, i: any) => sum + i.quantity,
                                  0
                                );
                              const percentage = (
                                (item.quantity / totalQuantity) *
                                100
                              ).toFixed(1);
                              const avgRevenue =
                                item.quantity > 0
                                  ? item.revenue / item.quantity
                                  : 0;

                              return (
                                <tr
                                  key={index}
                                  className="border-t border-green-100 hover:bg-green-50"
                                >
                                  <td className="px-4 py-3 font-medium">
                                    {item.name}
                                  </td>
                                  <td className="px-4 py-3">{item.quantity}</td>
                                  <td className="px-4 py-3">
                                    {formatCurrency(item.revenue)}
                                  </td>
                                  <td className="px-4 py-3">{percentage}%</td>
                                  <td className="px-4 py-3">
                                    {formatCurrency(avgRevenue)}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="print:hidden border-green-200 shadow-md">
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-medium mb-2">
                  Tidak Ada Data Laporan
                </h3>
                <p className="text-muted-foreground">
                  Pilih rentang tanggal dan jenis laporan untuk membuat laporan.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
