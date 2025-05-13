import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

/**
 * Export audit logs to PDF with a restaurant-style template.
 * @param {Array} logs - Array of audit log objects.
 * @param {Object} [filters] - Optional filters info (user, action, table, date, etc).
 */
export default function exportAuditLogToPDF(logs, filters = {}) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("SAJIWA STEAK RESTAURANT", 105, 18, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Jl. Pahlawan No. 123, Jakarta Selatan", 105, 25, {
    align: "center",
  });
  doc.text("Telp: (021) 555-1234 | info@sajiwarestaurant.com", 105, 30, {
    align: "center",
  });
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 34, 195, 34);

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("AUDIT LOG REPORT", 105, 42, { align: "center" });

  // Info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, 105, 48, {
    align: "center",
  });

  // Filter Info
  let y = 54;
  if (filters && Object.keys(filters).length > 0) {
    doc.setFontSize(11);
    doc.text("Filters:", 15, y);
    y += 6;
    Object.entries(filters).forEach(([key, val]) => {
      if (val) {
        doc.setFontSize(10);
        doc.text(`• ${key}: ${val}`, 20, y);
        y += 6;
      }
    });
    y += 2;
  }

  // Table
  const tableHead = [
    ["ID", "Date", "User", "Role", "Action", "Table", "Record", "Description"],
  ];
  const tableBody = logs.map((log) => [
    `#${log.id}`,
    format(new Date(log.createdAt), "yyyy-MM-dd HH:mm"),
    log.user?.username || "-",
    log.user?.role || "-",
    log.action,
    log.tableName,
    log.recordId,
    log.description || "-",
  ]);

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      1: { halign: "center", cellWidth: 30 },
      2: { halign: "center", cellWidth: 22 },
      3: { halign: "center", cellWidth: 18 },
      4: { halign: "center", cellWidth: 18 },
      5: { halign: "center", cellWidth: 22 },
      6: { halign: "center", cellWidth: 16 },
      7: { cellWidth: 50 },
    },
    styles: { fontSize: 8, cellPadding: 2 },
    theme: "grid",
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
    doc.text("© 2025 Sajiwa Steak Restaurant. All rights reserved.", 105, 295, {
      align: "center",
    });
  }

  doc.save(`sajiwa_audit_log_${format(new Date(), "yyyy-MM-dd_HHmm")}.pdf`);
}
