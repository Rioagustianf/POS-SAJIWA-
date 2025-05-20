// Import library jsPDF untuk membuat dokumen PDF
import jsPDF from "jspdf";
// Import plugin autoTable untuk membuat tabel otomatis di PDF
import autoTable from "jspdf-autotable";
// Import fungsi format dari date-fns untuk memformat tanggal
import { format } from "date-fns";

/**
 * Export audit logs to PDF with a restaurant-style template.
 * @param {Array} logs - Array of audit log objects.
 * @param {Object} [filters] - Optional filters info (user, action, table, date, etc).
 */
export default function exportAuditLogToPDF(logs, filters = {}) {
  // Inisialisasi dokumen PDF baru
  const doc = new jsPDF();

  // Membuat header dokumen
  doc.setFontSize(18); // Set ukuran font 18
  doc.setFont("helvetica", "bold"); // Set font Helvetica bold
  doc.text("SAJIWA STEAK RESTAURANT", 105, 18, { align: "center" }); // Tulis nama restoran
  doc.setFontSize(10); // Set ukuran font 10
  doc.setFont("helvetica", "normal"); // Set font normal
  doc.text("Jl. Pahlawan No. 123, Jakarta Selatan", 105, 25, {
    align: "center", // Tulis alamat restoran
  });
  doc.text("Telp: (021) 555-1234 | info@sajiwarestaurant.com", 105, 30, {
    align: "center", // Tulis kontak restoran
  });
  doc.setDrawColor(200, 200, 200); // Set warna garis abu-abu
  doc.line(15, 34, 195, 34); // Buat garis pemisah

  // Membuat judul laporan
  doc.setFontSize(14); // Set ukuran font 14
  doc.setFont("helvetica", "bold"); // Set font bold
  doc.text("AUDIT LOG REPORT", 105, 42, { align: "center" }); // Tulis judul

  // Menambahkan informasi waktu pembuatan
  doc.setFontSize(10); // Set ukuran font 10
  doc.setFont("helvetica", "normal"); // Set font normal
  doc.text(`Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, 105, 48, {
    align: "center", // Tulis waktu pembuatan laporan
  });

  // Menambahkan informasi filter jika ada
  let y = 54; // Posisi y awal untuk filter
  if (filters && Object.keys(filters).length > 0) {
    doc.setFontSize(11); // Set ukuran font 11
    doc.text("Filters:", 15, y); // Tulis label filter
    y += 6; // Geser posisi y ke bawah
    Object.entries(filters).forEach(([key, val]) => {
      if (val) {
        doc.setFontSize(10); // Set ukuran font 10
        doc.text(`• ${key}: ${val}`, 20, y); // Tulis setiap filter
        y += 6; // Geser posisi y ke bawah
      }
    });
    y += 2; // Tambah spasi setelah filter
  }

  // Menyiapkan data untuk tabel
  const tableHead = [
    // Header tabel
    ["ID", "Date", "User", "Role", "Action", "Table", "Record", "Description"],
  ];
  const tableBody = logs.map((log) => [
    // Isi tabel dari data log
    `#${log.id}`,
    format(new Date(log.createdAt), "yyyy-MM-dd HH:mm"),
    log.user?.username || "-",
    log.user?.role || "-",
    log.action,
    log.tableName,
    log.recordId,
    log.description || "-",
  ]);

  // Membuat tabel dengan autoTable
  autoTable(doc, {
    startY: y, // Posisi awal tabel
    head: tableHead, // Header tabel
    body: tableBody, // Isi tabel
    headStyles: {
      // Style untuk header
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      // Style untuk setiap kolom
      0: { halign: "center", cellWidth: 12 },
      1: { halign: "center", cellWidth: 30 },
      2: { halign: "center", cellWidth: 22 },
      3: { halign: "center", cellWidth: 18 },
      4: { halign: "center", cellWidth: 18 },
      5: { halign: "center", cellWidth: 22 },
      6: { halign: "center", cellWidth: 16 },
      7: { cellWidth: 50 },
    },
    styles: { fontSize: 8, cellPadding: 2 }, // Style umum
    theme: "grid", // Tema tabel
  });

  // Menambahkan footer di setiap halaman
  const pageCount = doc.internal.getNumberOfPages(); // Hitung jumlah halaman
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i); // Set halaman aktif
    doc.setFontSize(8); // Set ukuran font 8
    doc.setTextColor(150, 150, 150); // Set warna teks abu-abu
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" }); // Tulis nomor halaman
    doc.text("© 2025 Sajiwa Steak Restaurant. All rights reserved.", 105, 295, {
      align: "center", // Tulis copyright
    });
  }

  // Simpan dokumen PDF dengan nama yang berisi timestamp
  doc.save(`sajiwa_audit_log_${format(new Date(), "yyyy-MM-dd_HHmm")}.pdf`);
}
