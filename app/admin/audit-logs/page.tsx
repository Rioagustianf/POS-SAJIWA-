"use client"; // Memberi tahu bahwa file ini untuk frontend (client side) di Next.js

// Import library dan komponen yang dibutuhkan
import { useState, useEffect } from "react"; // Untuk state dan efek samping di React
import {
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  RefreshCw,
} from "lucide-react"; // Icon yang digunakan di tampilan
import { toast } from "sonner"; // Untuk menampilkan notifikasi
import AdminLayout from "@/components/layout/admin-layout"; // Layout admin
import { format } from "date-fns"; // Untuk format tanggal
import exportAuditLogToPDF from "@/lib/exportAuditLogToPDF"; // Fungsi export ke PDF

// Komponen utama halaman AuditLogs
export default function AuditLogs() {
  // State untuk menyimpan data log audit
  const [logs, setLogs] = useState([]);
  // State untuk status loading (sedang mengambil data atau tidak)
  const [isLoading, setIsLoading] = useState(true);
  // State untuk kata kunci pencarian
  const [searchTerm, setSearchTerm] = useState("");
  // State untuk filter (nama tabel, aksi, user, tanggal)
  const [filters, setFilters] = useState({
    tableName: "",
    action: "",
    userId: "",
    startDate: "",
    endDate: "",
  });
  // State untuk menampilkan/menyembunyikan filter
  const [showFilters, setShowFilters] = useState(false);
  // State untuk pagination (halaman, limit, total data, total halaman)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  // State untuk log yang dipilih (untuk detail)
  const [selectedLog, setSelectedLog] = useState(null);
  // State untuk menampilkan/menyembunyikan modal detail log
  const [showLogModal, setShowLogModal] = useState(false);
  // State untuk daftar user (untuk filter)
  const [users, setUsers] = useState([]);
  // State untuk daftar nama tabel (untuk filter)
  const [tableNames, setTableNames] = useState([]);
  // State untuk daftar aksi (hanya CREATE, UPDATE, DELETE)
  const [actions, setActions] = useState(["CREATE", "UPDATE", "DELETE"]);

  // useEffect: otomatis jalankan fetchAuditLogs dan fetchUsers saat halaman load atau filter/pagination berubah
  useEffect(() => {
    fetchAuditLogs();
    fetchUsers();
  }, [pagination.page, filters]);

  // Fungsi mengambil data audit log dari API
  const fetchAuditLogs = async () => {
    setIsLoading(true); // Tampilkan loading
    try {
      // Siapkan parameter query dari pagination dan filter
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      // Tambahkan filter jika ada isinya
      if (filters.tableName) params.append("tableName", filters.tableName);
      if (filters.action) params.append("action", filters.action);
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      // Ambil data dari API
      const response = await fetch(`/api/audit-logs?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      // Jika gagal, lempar error
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Ambil data JSON dari response
      const data = await response.json();
      setLogs(data.logs); // Simpan log ke state
      setPagination(data.pagination); // Simpan pagination ke state

      // Ambil nama tabel unik dari data log untuk filter
      const uniqueTableNames = [
        ...new Set(data.logs.map((log) => log.tableName)),
      ];
      setTableNames(uniqueTableNames);

      setIsLoading(false); // Selesai loading
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to load audit logs"); // Tampilkan notifikasi error
      setIsLoading(false);
    }
  };

  // Fungsi mengambil daftar user dari API (untuk filter)
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data); // Simpan user ke state
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Fungsi ketika user mengetik di kolom pencarian
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Fungsi ketika filter diubah
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  // Fungsi untuk menerapkan filter, reset ke halaman 1
  const applyFilters = () => {
    setPagination({ ...pagination, page: 1 });
  };

  // Fungsi untuk mereset semua filter ke default
  const resetFilters = () => {
    setFilters({
      tableName: "",
      action: "",
      userId: "",
      startDate: "",
      endDate: "",
    });
    setPagination({ ...pagination, page: 1 });
  };

  // Fungsi untuk pindah halaman pada pagination
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, page: newPage });
    }
  };

  // Fungsi untuk menampilkan detail log di modal
  const viewLogDetails = (log) => {
    setSelectedLog(log);
    setShowLogModal(true);
  };

  // Fungsi untuk export data log yang difilter ke PDF
  const handleExportPDF = () => {
    exportAuditLogToPDF(filteredLogs, {
      ...(filters.tableName && { Table: filters.tableName }),
      ...(filters.action && { Action: filters.action }),
      ...(filters.userId && {
        User: users.find((u) => u.id == filters.userId)?.username,
      }),
      ...(filters.startDate && { "Start Date": filters.startDate }),
      ...(filters.endDate && { "End Date": filters.endDate }),
    });
  };

  // Filter log berdasarkan kata kunci pencarian
  const filteredLogs = logs.filter((log) => {
    return (
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.tableName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Fungsi untuk menampilkan data JSON dengan format rapi
  const formatJSON = (jsonData) => {
    try {
      if (!jsonData) return "No data";
      if (typeof jsonData === "string") {
        return JSON.stringify(JSON.parse(jsonData), null, 2);
      }
      return JSON.stringify(jsonData, null, 2);
    } catch (error) {
      return String(jsonData);
    }
  };

  // Tampilan utama halaman
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header dan search/filter/export */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold">Audit Logs</h1>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Kolom pencarian */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-9 pr-4 py-2 border border-input rounded-md w-full sm:w-64 bg-background"
              />
            </div>

            {/* Tombol filter dan export */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>

              <button
                onClick={handleExportPDF}
                className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors"
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Form filter */}
        {showFilters && (
          <div className="bg-card rounded-lg shadow p-4 mb-4">
            <h2 className="text-lg font-semibold mb-3">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filter nama tabel */}
              <div>
                <label
                  htmlFor="tableName"
                  className="block text-sm font-medium mb-1"
                >
                  Table
                </label>
                <select
                  id="tableName"
                  name="tableName"
                  value={filters.tableName}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">All Tables</option>
                  {tableNames.map((table) => (
                    <option key={table} value={table}>
                      {table}
                    </option>
                  ))}
                </select>
              </div>
              {/* Filter aksi */}
              <div>
                <label
                  htmlFor="action"
                  className="block text-sm font-medium mb-1"
                >
                  Action
                </label>
                <select
                  id="action"
                  name="action"
                  value={filters.action}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">All Actions</option>
                  {actions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </div>
              {/* Filter user */}
              <div>
                <label
                  htmlFor="userId"
                  className="block text-sm font-medium mb-1"
                >
                  User
                </label>
                <select
                  id="userId"
                  name="userId"
                  value={filters.userId}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>
              {/* Filter tanggal mulai */}
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium mb-1"
                >
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>
              {/* Filter tanggal akhir */}
              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium mb-1"
                >
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>
              {/* Tombol apply dan reset filter */}
              <div className="flex items-end gap-2">
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Apply Filters
                </button>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tampilkan loading jika sedang mengambil data */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">
                Loading audit logs...
              </p>
            </div>
          </div>
        ) : (
          // Tabel data log audit
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-left">Table</th>
                    <th className="px-4 py-3 text-left">Record ID</th>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length > 0 ? (
                    // Tampilkan data log hasil filter
                    filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-t border-border hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 font-medium">#{log.id}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              log.action === "CREATE"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : log.action === "UPDATE"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate">
                          {log.description}
                        </td>
                        <td className="px-4 py-3">{log.tableName}</td>
                        <td className="px-4 py-3">{log.recordId}</td>
                        <td className="px-4 py-3">
                          {log.user.username}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({log.user.role})
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {format(
                            new Date(log.createdAt),
                            "MMM d, yyyy h:mm a"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => viewLogDetails(log)}
                            className="p-1 rounded-md hover:bg-muted transition-colors text-primary"
                            aria-label="View log details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Jika tidak ada data log
                    <tr>
                      <td
                        colSpan="8"
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No audit logs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  {/* Info jumlah data yang ditampilkan */}
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} entries
                </div>
                {/* Tombol navigasi halaman */}
                <div className="flex gap-1">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 rounded-md border border-input hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 rounded-md border border-input hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 rounded-md border border-input hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 rounded-md border border-input hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal detail log */}
        {showLogModal && selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="p-6 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Audit Log Details</h2>
                  <button
                    onClick={() => setShowLogModal(false)}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    &times;
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      ID
                    </p>
                    <p className="font-medium">#{selectedLog.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Action
                    </p>
                    <p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          selectedLog.action === "CREATE"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : selectedLog.action === "UPDATE"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {selectedLog.action}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Description
                    </p>
                    <p>{selectedLog.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Date
                    </p>
                    <p>
                      {format(
                        new Date(selectedLog.createdAt),
                        "MMMM d, yyyy h:mm:ss a"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Table
                    </p>
                    <p>{selectedLog.tableName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Record ID
                    </p>
                    <p>{selectedLog.recordId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      User
                    </p>
                    <p>
                      {selectedLog.user.username}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({selectedLog.user.role})
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tampilkan data sebelum perubahan jika ada */}
                  {selectedLog.oldData && (
                    <div>
                      <h3 className="font-semibold mb-2">Old Data</h3>
                      <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs">
                        {formatJSON(selectedLog.oldData)}
                      </pre>
                    </div>
                  )}
                  {/* Tampilkan data setelah perubahan jika ada */}
                  {selectedLog.newData && (
                    <div>
                      <h3 className="font-semibold mb-2">New Data</h3>
                      <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs">
                        {formatJSON(selectedLog.newData)}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowLogModal(false)}
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
    </AdminLayout>
  );
}
