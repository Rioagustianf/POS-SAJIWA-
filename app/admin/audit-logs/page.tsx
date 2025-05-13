"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/admin-layout";
import { format } from "date-fns";
import exportAuditLogToPDF from "@/lib/exportAuditLogToPDF";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    tableName: "",
    action: "",
    userId: "",
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [tableNames, setTableNames] = useState([]);
  const [actions, setActions] = useState(["CREATE", "UPDATE", "DELETE"]);

  useEffect(() => {
    fetchAuditLogs();
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (filters.tableName) params.append("tableName", filters.tableName);
      if (filters.action) params.append("action", filters.action);
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/audit-logs?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);

      // Extract unique table names for filter
      const uniqueTableNames = [
        ...new Set(data.logs.map((log) => log.tableName)),
      ];
      setTableNames(uniqueTableNames);

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to load audit logs");
      setIsLoading(false);
    }
  };

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
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const applyFilters = () => {
    setPagination({ ...pagination, page: 1 }); // Reset to first page when applying filters
  };

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

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, page: newPage });
    }
  };

  const viewLogDetails = (log) => {
    setSelectedLog(log);
    setShowLogModal(true);
  };

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

  // Filter logs by search term
  const filteredLogs = logs.filter((log) => {
    return (
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.tableName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Format JSON data for display
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold">Audit Logs</h1>

          <div className="flex flex-col sm:flex-row gap-3">
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

        {showFilters && (
          <div className="bg-card rounded-lg shadow p-4 mb-4">
            <h2 className="text-lg font-semibold mb-3">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} entries
                </div>
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
      </div>

      {/* Log Details Modal */}
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
                {selectedLog.oldData && (
                  <div>
                    <h3 className="font-semibold mb-2">Old Data</h3>
                    <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs">
                      {formatJSON(selectedLog.oldData)}
                    </pre>
                  </div>
                )}
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
    </AdminLayout>
  );
}
