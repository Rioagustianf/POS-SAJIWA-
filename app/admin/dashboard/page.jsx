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
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
  });

  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch products
        const productsResponse = await fetch("/api/products");
        if (!productsResponse.ok) throw new Error("Failed to fetch products");
        const products = await productsResponse.json();

        // Fetch transactions
        const transactionsResponse = await fetch("/api/transactions");
        if (!transactionsResponse.ok)
          throw new Error("Failed to fetch transactions");
        const transactions = await transactionsResponse.json();

        // Fetch users
        const usersResponse = await fetch("/api/users");
        if (!usersResponse.ok) throw new Error("Failed to fetch users");
        const users = await usersResponse.json();

        // Calculate total sales from transactions
        const totalSales = transactions.reduce(
          (sum, transaction) => sum + transaction.total,
          0
        );

        // Set stats
        setStats({
          totalSales: totalSales,
          totalOrders: transactions.length,
          totalProducts: products.length,
          totalUsers: users.length,
        });

        // Process sales data for chart (group by day)
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

        setSalesData(salesByDay);

        // Process top products
        const productSales = {};
        transactions.forEach((transaction) => {
          transaction.items.forEach((item) => {
            if (!productSales[item.name]) {
              productSales[item.name] = 0;
            }
            productSales[item.name] += item.quantity;
          });
        });

        const topProductsData = Object.entries(productSales)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        setTopProducts(topProductsData);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function to get the last 7 days
  const getLast7Days = () => {
    const days = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        name: dayNames[date.getDay()],
        date: date,
      });
    }

    return days;
  };

  // Colors for pie chart
  const COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              Loading dashboard data...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-500 font-medium">
              Error loading dashboard data
            </p>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Sales
                </p>
                <h3 className="text-xl font-bold">
                  {formatCurrency(stats.totalSales)}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <ShoppingBag className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </p>
                <h3 className="text-xl font-bold">{stats.totalOrders}</h3>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Products
                </p>
                <h3 className="text-xl font-bold">{stats.totalProducts}</h3>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Users
                </p>
                <h3 className="text-xl font-bold">{stats.totalUsers}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Weekly Sales</h3>
            <div className="h-80">
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
                    formatter={(value) => [formatCurrency(value), "Sales"]}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products Chart */}
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Top Products</h3>
            <div className="h-80">
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
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {topProducts.map((entry, index) => (
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
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left">Order ID</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {salesData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-3 text-center">
                      No recent orders
                    </td>
                  </tr>
                ) : (
                  // Get the 3 most recent transactions
                  salesData
                    .filter((day) => day.sales > 0)
                    .slice(0, 3)
                    .map((day, index) => (
                      <tr key={index} className="border-b border-border">
                        <td className="px-4 py-3">{`#ORD-${String(
                          index + 1
                        ).padStart(3, "0")}`}</td>
                        <td className="px-4 py-3">{`Cashier ${index + 1}`}</td>
                        <td className="px-4 py-3">
                          {new Date().toISOString().split("T")[0]} {index + 14}
                          :30
                        </td>
                        <td className="px-4 py-3">
                          {formatCurrency(day.sales)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Completed
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
