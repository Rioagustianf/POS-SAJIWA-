"use client";

import { useState, useEffect } from "react";
import { Calendar, Search, FileText, ArrowUpDown, Eye } from "lucide-react";
import { format } from "date-fns";
// Tidak perlu import sidebar lagi karena sudah ditangani oleh layout

export default function SalesHistory() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch user data dan transactions
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch("/api/auth/me");
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
        }

        // Fetch transactions
        const response = await fetch("/api/transactions", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch transactions");
        }

        const data = await response.json();
        console.log("Fetched Transactions:", data);

        // Pastikan data yang diterima adalah array
        setTransactions(Array.isArray(data) ? data : []);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setTransactions([]);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDateFilter = (e) => {
    setDateFilter(e.target.value);
  };

  const viewReceipt = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.id.toString().includes(searchTerm);

    const matchesDate = dateFilter
      ? format(new Date(transaction.date), "yyyy-MM-dd") === dateFilter
      : true;

    return matchesSearch && matchesDate;
  });

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Sales History</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
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
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-1">
                      Transaction ID
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-1">
                      Date
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">Cashier</th>
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-1">
                      Total
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">Payment Method</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">
                        #{transaction.id}
                      </td>
                      <td className="px-4 py-3">
                        {format(new Date(transaction.date), "yyyy-MM-dd HH:mm")}
                      </td>
                      <td className="px-4 py-3">{transaction.cashier}</td>
                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(transaction.total)}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {transaction.paymentMethod}
                      </td>
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

      {/* Receipt Modal */}
      {showReceiptModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="text-center mb-4">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <h2 className="text-xl font-bold">
                  Receipt #{selectedTransaction.id}
                </h2>
                <p className="text-muted-foreground">Sajiwa Steak Restaurant</p>
              </div>

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
