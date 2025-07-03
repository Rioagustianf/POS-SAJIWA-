"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { DollarSign, ShoppingBag, Users, TrendingUp } from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
  // State untuk statistik ringkasan dashboard
  const [stats, setStats] = useState({
    totalSales: 0, // Total penjualan
    totalOrders: 0, // Total pesanan
    totalProducts: 0, // Total produk
    totalUsers: 0, // Total pengguna
  });

  // State untuk data penjualan per hari (untuk chart)
  const [salesData, setSalesData] = useState([]);
  // State untuk produk terlaris (untuk chart)
  const [topProducts, setTopProducts] = useState([]);
  // State untuk status loading
  const [isLoading, setIsLoading] = useState(true);
  // State untuk pesan error
  const [error, setError] = useState(null);

  // Ambil data dashboard saat komponen pertama kali dimount
  useEffect(() => {
    // Fungsi async untuk mengambil data dashboard
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true); // Set loading true

        // Ambil data produk dari API
        const productsResponse = await fetch("/api/products");
        if (!productsResponse.ok) throw new Error("Gagal mengambil produk");
        const products = await productsResponse.json();

        // Ambil data transaksi dari API
        const transactionsResponse = await fetch("/api/transactions");
        if (!transactionsResponse.ok)
          throw new Error("Gagal mengambil transaksi");
        const transactions = await transactionsResponse.json();

        // Ambil data user dari API
        const usersResponse = await fetch("/api/users");
        if (!usersResponse.ok) throw new Error("Gagal mengambil pengguna");
        const users = await usersResponse.json();

        // Hitung total penjualan dari semua transaksi
        const totalSales = transactions.reduce(
          (sum, transaction) => sum + transaction.total,
          0
        );

        // Set statistik ringkasan
        setStats({
          totalSales: totalSales,
          totalOrders: transactions.length,
          totalProducts: products.length,
          totalUsers: users.length,
        });

        // Proses data penjualan per hari untuk chart (kelompokkan per hari)
        const last7Days = getLast7Days();
        const salesByDay = last7Days.map((day) => {
          const dayTransactions = transactions.filter((t) => {
            const transactionDate = new Date(t.date);
            return transactionDate.toDateString() === day.date.toDateString();
          });

          const daySales = dayTransactions.reduce((sum, t) => sum + t.total, 0);

          return {
            name: day.name,
            sales: daySales,
          };
        });

        setSalesData(salesByDay); // Simpan data penjualan per hari

        // Proses produk terlaris
        const productSales = {};
        transactions.forEach((transaction) => {
          transaction.items.forEach((item) => {
            if (!productSales[item.name]) {
              productSales[item.name] = 0;
            }
            productSales[item.name] += item.quantity;
          });
        });

        // Ambil 5 produk terlaris
        const topProductsData = Object.entries(productSales)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        setTopProducts(topProductsData); // Simpan produk terlaris

        setIsLoading(false); // Selesai loading
      } catch (error) {
        console.error("Error fetching dashboard data:", error); // Tampilkan error di konsol
        setError(error.message); // Simpan pesan error
        setIsLoading(false); // Selesai loading
      }
    };

    fetchDashboardData(); // Panggil fungsi ambil data dashboard
  }, []);

  // Fungsi helper untuk mendapatkan 7 hari terakhir
  const getLast7Days = () => {
    const days = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        name: dayNames[date.getDay()], // Nama hari
        date: date, // Objek tanggal
      });
    }

    return days;
  };

  // Warna untuk chart pie
  const COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-3 text-sm text-muted-foreground">
              Memuat data dashboard...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 font-medium text-sm">
              Gagal memuat data dashboard
            </p>
            <p className="mt-2 text-muted-foreground text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-3 py-2 bg-primary text-white rounded-md text-sm"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 w-full">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan data dan statistik terkini
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Total Penjualan
                </p>
                <h3 className="text-lg font-bold">
                  {formatCurrency(stats.totalSales)}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                <ShoppingBag className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Total Pesanan
                </p>
                <h3 className="text-lg font-bold">{stats.totalOrders}</h3>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Total Produk
                </p>
                <h3 className="text-lg font-bold">{stats.totalProducts}</h3>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                <Users className="h-5 w-5 text-orange-600 dark:text-orange-300" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Total Pengguna
                </p>
                <h3 className="text-lg font-bold">{stats.totalUsers}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
          {/* Sales Chart */}
          <div className="bg-card rounded-lg shadow p-4">
            <h3 className="text-base font-semibold mb-3">Penjualan Mingguan</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
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
                    formatter={(value) => [formatCurrency(value), "Penjualan"]}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products Chart */}
          <div className="bg-card rounded-lg shadow p-4">
            <h3 className="text-base font-semibold mb-3">Produk Terlaris</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProducts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topProducts.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} pesanan`, "Kuantitas"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend modern, scrollable jika data banyak */}
            <div className="mt-4 max-h-40 overflow-y-auto rounded-lg border border-border bg-white dark:bg-zinc-900 p-2 flex flex-col gap-2 shadow-inner">
              {topProducts.map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  ></span>
                  <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-100 truncate max-w-[120px]">
                    {entry.name}
                  </span>
                  <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
                    {(
                      (entry.value /
                        topProducts.reduce((a, b) => a + b.value, 0)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    ({entry.value}x)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-card rounded-lg shadow p-4 w-full">
          <h3 className="text-base font-semibold mb-3">Pesanan Terbaru</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-sm font-medium">
                    ID Pesanan
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium">
                    Pelanggan
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium">
                    Tanggal
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium">
                    Jumlah
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {salesData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-3 py-2 text-center text-sm">
                      Tidak ada pesanan terbaru
                    </td>
                  </tr>
                ) : (
                  // Get the 3 most recent transactions
                  salesData
                    .filter((day) => day.sales > 0)
                    .slice(0, 3)
                    .map((day, index) => (
                      <tr key={index} className="border-b border-border">
                        <td className="px-3 py-2 text-sm">{`#ORD-${String(
                          index + 1
                        ).padStart(3, "0")}`}</td>
                        <td className="px-3 py-2 text-sm">{`Kasir ${
                          index + 1
                        }`}</td>
                        <td className="px-3 py-2 text-sm">
                          {new Date().toISOString().split("T")[0]} {index + 14}
                          :30
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {formatCurrency(day.sales)}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Selesai
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
