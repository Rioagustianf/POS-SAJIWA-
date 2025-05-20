"use client";

import { useState, useEffect } from "react";
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
} from "recharts";
import {
  Calendar,
  Download,
  FileText,
  Loader2,
  Printer,
  AlertTriangle,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/admin-layout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Pastikan import jsPDF dan jspdf-autotable dengan benar
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Komponen utama untuk halaman laporan admin
export default function Reports() {
  // State untuk menyimpan rentang tanggal yang dipilih
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });
  // State untuk tipe laporan yang dipilih (penjualan, produk, kategori)
  const [reportType, setReportType] = useState("sales");
  // State untuk data laporan yang diambil dari server
  const [reportData, setReportData] = useState(null);
  // State untuk status loading saat mengambil data
  const [isLoading, setIsLoading] = useState(false);
  // State untuk menyimpan pesan error jika terjadi kesalahan
  const [error, setError] = useState(null);
  // State untuk menyimpan peran user (misal: admin, manajer)
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  // useEffect untuk memeriksa peran user saat pertama kali halaman dibuka
  useEffect(() => {
    checkUserRole(); // Panggil fungsi cek peran user saat komponen mount
  }, []);

  // useEffect untuk mengambil data laporan setiap kali rentang tanggal atau tipe laporan berubah
  useEffect(() => {
    fetchReportData(); // Ambil data laporan setiap kali dateRange atau reportType berubah
  }, [dateRange, reportType]);

  // Fungsi untuk memeriksa peran user dengan memanggil API
  const checkUserRole = async () => {
    try {
      const response = await fetch("/api/auth/me"); // Panggil API untuk data user
      if (!response.ok) {
        throw new Error("Gagal mengambil data user"); // Jika gagal, lempar error
      }
      const userData = await response.json(); // Ambil data user
      const roles = userData.roles || [];
      setUserRole(roles); // Simpan peran user ke state
    } catch (error) {
      console.error("Error checking user role:", error); // Tampilkan error di konsol
    }
  };

  // Fungsi untuk mengekspor laporan ke PDF
  const exportToPDF = () => {
    try {
      // Membuat dokumen PDF baru
      const doc = new jsPDF();

      // Tambahkan header
      doc.setFontSize(18);
      doc.text("Sajiwa Steak Restaurant", 105, 15, { align: "center" });

      doc.setFontSize(14);
      let reportTitle = "";
      if (reportType === "sales") reportTitle = "Laporan Penjualan";
      if (reportType === "products") reportTitle = "Laporan Produk";
      if (reportType === "categories") reportTitle = "Laporan Kategori";
      doc.text(reportTitle, 105, 25, { align: "center" });

      doc.setFontSize(10);
      doc.text(`Periode: ${dateRange.start} s/d ${dateRange.end}`, 105, 35, {
        align: "center",
      });
      doc.text(
        `Dibuat pada: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`,
        105,
        42,
        { align: "center" }
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
      const startY = reportType === "sales" ? 100 : 60;
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
          head: [["Tanggal", "Penjualan", "Pesanan", "Rata-rata Pesanan"]],
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
          "Laporan ini dihasilkan secara otomatis oleh sistem",
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
        `${reportType}_report_${dateRange.start}_to_${dateRange.end}.pdf`
      );
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Terjadi kesalahan saat mengekspor PDF. Silakan coba lagi.");
    }
  };

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
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
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
      default:
        break;
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reports</h1>
          <div className="flex gap-2">
            <Button onClick={exportToPDF} disabled={!reportData}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            {userRole && userRole.includes("Manajer") && (
              <Link href="/admin/print-reports">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Laporan Manajerial
                </Button>
              </Link>
            )}
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
        <div className="bg-card rounded-lg shadow p-4 print:hidden">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Date Range</label>
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
                <span className="hidden sm:flex items-center">to</span>
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
              <label className="text-sm font-medium">Quick Select</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleQuickDateRange("today")}
                  className="px-3 py-1 border border-input rounded-md hover:bg-muted transition-colors text-sm"
                >
                  Today
                </button>
                <button
                  onClick={() => handleQuickDateRange("yesterday")}
                  className="px-3 py-1 border border-input rounded-md hover:bg-muted transition-colors text-sm"
                >
                  Yesterday
                </button>
                <button
                  onClick={() => handleQuickDateRange("week")}
                  className="px-3 py-1 border border-input rounded-md hover:bg-muted transition-colors text-sm"
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => handleQuickDateRange("month")}
                  className="px-3 py-1 border border-input rounded-md hover:bg-muted transition-colors text-sm"
                >
                  This Month
                </button>
                <button
                  onClick={() => handleQuickDateRange("30days")}
                  className="px-3 py-1 border border-input rounded-md hover:bg-muted transition-colors text-sm"
                >
                  Last 30 Days
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleReportTypeChange("sales")}
                className={`px-4 py-2 rounded-md transition-colors ${
                  reportType === "sales"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                Sales Report
              </button>
              <button
                onClick={() => handleReportTypeChange("products")}
                className={`px-4 py-2 rounded-md transition-colors ${
                  reportType === "products"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                Product Report
              </button>
              <button
                onClick={() => handleReportTypeChange("categories")}
                className={`px-4 py-2 rounded-md transition-colors ${
                  reportType === "categories"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                Category Report
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading report data...</p>
            </div>
          </div>
        ) : reportData ? (
          <>
            {/* Summary Cards */}
            {reportType === "sales" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
                <div className="bg-card rounded-lg shadow p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Total Sales
                  </h3>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(reportData.summary.totalSales)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dateRange.start === dateRange.end
                      ? `on ${dateRange.start}`
                      : `from ${dateRange.start} to ${dateRange.end}`}
                  </p>
                </div>

                <div className="bg-card rounded-lg shadow p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Total Orders
                  </h3>
                  <p className="text-2xl font-bold mt-1">
                    {reportData.summary.totalOrders}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reportData.salesData.length} day
                    {reportData.salesData.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="bg-card rounded-lg shadow p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Average Order Value
                  </h3>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(reportData.summary.averageSale)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Per transaction
                  </p>
                </div>
              </div>
            )}

            {/* Charts */}
            <div className="bg-card rounded-lg shadow p-6">
              {reportType === "sales" && (
                <>
                  <h2 className="text-xl font-semibold mb-4">Sales Trend</h2>
                  <div className="h-80 print:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={reportData.salesData}
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
                            "Sales",
                          ]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="sales"
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {reportType === "products" && (
                <>
                  <h2 className="text-xl font-semibold mb-4">Top Products</h2>
                  <div className="h-80 print:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={reportData.topProducts}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(value) => [`${value} orders`, "Quantity"]}
                        />
                        <Bar dataKey="quantity" fill="hsl(var(--chart-2))">
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
                </>
              )}

              {reportType === "categories" && (
                <>
                  <h2 className="text-xl font-semibold mb-4">
                    Sales by Category
                  </h2>
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
                          formatter={(value) => [`${value} orders`, "Quantity"]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>

            {/* Detailed Data Table */}
            <div className="bg-card rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="text-xl font-semibold">Detailed Data</h2>
              </div>

              <div className="overflow-x-auto">
                {reportType === "sales" && (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Sales</th>
                        <th className="px-4 py-3 text-left">Orders</th>
                        <th className="px-4 py-3 text-left">
                          Avg. Order Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.salesData.map((item, index) => (
                        <tr key={index} className="border-t border-border">
                          <td className="px-4 py-3">{item.date}</td>
                          <td className="px-4 py-3 font-medium">
                            {formatCurrency(item.sales)}
                          </td>
                          <td className="px-4 py-3">{item.orders}</td>
                          <td className="px-4 py-3">
                            {formatCurrency(
                              item.orders > 0 ? item.sales / item.orders : 0
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {reportType === "products" && (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-left">Quantity Sold</th>
                        <th className="px-4 py-3 text-left">Revenue</th>
                        <th className="px-4 py-3 text-left">% of Total</th>
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

                        return (
                          <tr key={index} className="border-t border-border">
                            <td className="px-4 py-3 font-medium">
                              {item.name}
                            </td>
                            <td className="px-4 py-3">{item.quantity}</td>
                            <td className="px-4 py-3">
                              {formatCurrency(item.revenue)}
                            </td>
                            <td className="px-4 py-3">{percentage}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {reportType === "categories" && (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-left">Category</th>
                        <th className="px-4 py-3 text-left">Quantity Sold</th>
                        <th className="px-4 py-3 text-left">Revenue</th>
                        <th className="px-4 py-3 text-left">% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.categoryData.map((item, index) => {
                        const totalQuantity = reportData.categoryData.reduce(
                          (sum, i) => sum + i.quantity,
                          0
                        );
                        const percentage = (
                          (item.quantity / totalQuantity) *
                          100
                        ).toFixed(1);

                        return (
                          <tr key={index} className="border-t border-border">
                            <td className="px-4 py-3 font-medium">
                              {item.name}
                            </td>
                            <td className="px-4 py-3">{item.quantity}</td>
                            <td className="px-4 py-3">
                              {formatCurrency(item.revenue)}
                            </td>
                            <td className="px-4 py-3">{percentage}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-card rounded-lg shadow p-6 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">
              No Report Data Available
            </h3>
            <p className="text-muted-foreground">
              Select a date range and report type to generate a report.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
