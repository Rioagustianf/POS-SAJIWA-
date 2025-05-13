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
// Pastikan import jsPDF dan jspdf-autotable dengan benar
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function PrintReports() {
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });
  const [reportType, setReportType] = useState("sales");
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const printRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    // Langsung ambil data tanpa pemeriksaan peran
    fetchReportData();
    if (showComparison) {
      fetchComparisonData();
    }
  }, [dateRange, reportType, showComparison]);

  useEffect(() => {
    fetchReportData();
    if (showComparison) {
      fetchComparisonData();
    }
  }, [dateRange, reportType, showComparison]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      const response = await fetch(`/api/reports/sales?${queryParams}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch report data: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Add additional metrics for managers
      if (data.salesData && data.salesData.length > 0) {
        // Calculate growth rates
        const totalDays =
          differenceInDays(new Date(dateRange.end), new Date(dateRange.start)) +
          1;
        const midPoint = Math.floor(totalDays / 2);

        const firstHalfData = data.salesData.slice(0, midPoint);
        const secondHalfData = data.salesData.slice(midPoint);

        const firstHalfSales = firstHalfData.reduce(
          (sum, item) => sum + item.sales,
          0
        );
        const secondHalfSales = secondHalfData.reduce(
          (sum, item) => sum + item.sales,
          0
        );

        const growthRate =
          firstHalfSales > 0
            ? (
                ((secondHalfSales - firstHalfSales) / firstHalfSales) *
                100
              ).toFixed(2)
            : 0;

        // Add daily average
        const dailyAverage = data.summary.totalSales / totalDays;

        // Add to summary
        data.summary.growthRate = Number.parseFloat(growthRate);
        data.summary.dailyAverage = dailyAverage;
        data.summary.periodLength = totalDays;
      }

      setReportData(data);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComparisonData = async () => {
    try {
      // Calculate previous period with same length
      const currentStartDate = new Date(dateRange.start);
      const currentEndDate = new Date(dateRange.end);
      const periodLength =
        differenceInDays(currentEndDate, currentStartDate) + 1;

      const previousEndDate = subDays(currentStartDate, 1);
      const previousStartDate = subDays(previousEndDate, periodLength - 1);

      const queryParams = new URLSearchParams({
        startDate: format(previousStartDate, "yyyy-MM-dd"),
        endDate: format(previousEndDate, "yyyy-MM-dd"),
      });

      const response = await fetch(`/api/reports/sales?${queryParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch comparison data");
      }

      const data = await response.json();

      // Add additional metrics for comparison
      if (data.salesData && data.salesData.length > 0) {
        const totalDays =
          differenceInDays(previousEndDate, previousStartDate) + 1;
        const dailyAverage = data.summary.totalSales / totalDays;
        data.summary.periodLength = totalDays;
        data.summary.dailyAverage = dailyAverage;
      }

      setComparisonData(data);
    } catch (error) {
      console.error("Error fetching comparison data:", error);
    }
  };

  const handleStartDateChange = (e) => {
    setDateRange({
      ...dateRange,
      start: e.target.value,
    });
  };

  const handleEndDateChange = (e) => {
    setDateRange({
      ...dateRange,
      end: e.target.value,
    });
  };

  const handleReportTypeChange = (type) => {
    setReportType(type);
  };

  const handleQuickDateRange = (range) => {
    const today = new Date();

    switch (range) {
      case "today":
        setDateRange({
          start: format(today, "yyyy-MM-dd"),
          end: format(today, "yyyy-MM-dd"),
        });
        break;
      case "yesterday":
        const yesterday = subDays(today, 1);
        setDateRange({
          start: format(yesterday, "yyyy-MM-dd"),
          end: format(yesterday, "yyyy-MM-dd"),
        });
        break;
      case "week":
        setDateRange({
          start: format(subDays(today, 7), "yyyy-MM-dd"),
          end: format(today, "yyyy-MM-dd"),
        });
        break;
      case "month":
        setDateRange({
          start: format(startOfMonth(today), "yyyy-MM-dd"),
          end: format(endOfMonth(today), "yyyy-MM-dd"),
        });
        break;
      case "30days":
        setDateRange({
          start: format(subDays(today, 30), "yyyy-MM-dd"),
          end: format(today, "yyyy-MM-dd"),
        });
        break;
      case "90days":
        setDateRange({
          start: format(subDays(today, 90), "yyyy-MM-dd"),
          end: format(today, "yyyy-MM-dd"),
        });
        break;
      default:
        break;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToPDF = () => {
    try {
      // Inisialisasi jsPDF
      const doc = new jsPDF();

      // Tambahkan header
      doc.setFontSize(18);
      doc.text("Sajiwa Steak Restaurant", 105, 15, { align: "center" });

      doc.setFontSize(14);
      let reportTitle = "";
      if (reportType === "sales") reportTitle = "Laporan Penjualan Manajerial";
      if (reportType === "products") reportTitle = "Laporan Produk Manajerial";
      if (reportType === "categories")
        reportTitle = "Laporan Kategori Manajerial";
      doc.text(reportTitle, 105, 25, { align: "center" });

      doc.setFontSize(10);
      doc.text(
        `Periode: ${format(new Date(dateRange.start), "d MMMM yyyy", {
          locale: id,
        })} hingga ${format(new Date(dateRange.end), "d MMMM yyyy", {
          locale: id,
        })}`,
        105,
        35,
        { align: "center" }
      );

      doc.text(
        `Dibuat pada: ${format(new Date(), "d MMMM yyyy HH:mm", {
          locale: id,
        })}`,
        105,
        42,
        {
          align: "center",
        }
      );

      // Tambahkan ringkasan
      doc.setFontSize(12);
      doc.text("Ringkasan", 14, 55);

      if (reportType === "sales") {
        // Format currency
        const formatCurrency = (value) => {
          return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(value);
        };

        // Tabel ringkasan
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

        // Gunakan autoTable dari jspdf-autotable
        autoTable(doc, {
          startY: 60,
          head: [["Metrik", "Nilai"]],
          body: summaryData,
          theme: "grid",
          headStyles: { fillColor: [66, 66, 66] },
        });
      }

      // Tambahkan data detail
      const startY = reportType === "sales" ? 130 : 60;
      doc.setFontSize(12);
      doc.text("Data Detail", 14, startY - 5);

      if (reportType === "sales") {
        const tableData = reportData.salesData.map((item) => [
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
        });
      } else if (reportType === "products") {
        const tableData = reportData.topProducts.map((item) => {
          const totalQuantity = reportData.topProducts.reduce(
            (sum, i) => sum + i.quantity,
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
        });
      } else if (reportType === "categories") {
        const tableData = reportData.categoryData.map((item) => {
          const totalQuantity = reportData.categoryData.reduce(
            (sum, i) => sum + i.quantity,
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
        });
      }

      // Tambahkan footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          `Sajiwa Steak Restaurant - ${format(new Date(), "yyyy")}`,
          105,
          doc.internal.pageSize.height - 20,
          {
            align: "center",
          }
        );
        doc.text(
          "Laporan ini dibuat secara otomatis oleh sistem",
          105,
          doc.internal.pageSize.height - 15,
          {
            align: "center",
          }
        );
        doc.text(
          `Halaman ${i} dari ${pageCount}`,
          doc.internal.pageSize.width - 20,
          doc.internal.pageSize.height - 10
        );
      }

      // Simpan PDF
      doc.save(
        `laporan_manajerial_${reportType}_${dateRange.start}_${dateRange.end}.pdf`
      );
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Terjadi kesalahan saat mengekspor PDF. Silakan coba lagi.");
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calculate percentage change
  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
    };
  };

  // Colors for charts
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
            <Link href="/admin/reports">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
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
            <Button onClick={handlePrint} variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Print Header - Only visible when printing */}
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

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
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
              {/* Summary Cards */}
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

              {/* Additional Manager Metrics */}
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

              {/* Charts */}
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
                                {reportData.topProducts.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                ))}
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
                                {reportData.categoryData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                ))}
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
                              // Calculate cumulative data
                              let cumulativeTotal = 0;
                              return reportData.salesData.map((item) => {
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
                                // Calculate cumulative comparison data
                                let cumulativeTotal = 0;
                                const cumulativeComparisonData =
                                  comparisonData.salesData.map((item) => {
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

              {/* Detailed Data Table */}
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
                          {reportData.salesData.map((item, index) => {
                            // Find matching date in comparison data if available
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
                          {reportData.topProducts.map((item, index) => {
                            const totalQuantity = reportData.topProducts.reduce(
                              (sum, i) => sum + i.quantity,
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
                          })}
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
                          {reportData.categoryData.map((item, index) => {
                            const totalQuantity =
                              reportData.categoryData.reduce(
                                (sum, i) => sum + i.quantity,
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
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Print Footer - Only visible when printing */}
              <div className="hidden print:block print:mt-8">
                <div className="text-center text-sm text-muted-foreground">
                  <p>Sajiwa Steak Restaurant - {format(new Date(), "yyyy")}</p>
                  <p>Laporan ini dibuat secara otomatis oleh sistem</p>
                </div>
              </div>
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
