import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export function exportToPDF(transactions, filters = {}) {
  const doc = new jsPDF();

  // Logo dan Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text("SAJIWA STEAK RESTAURANT", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Jl. Pahlawan No. 123, Jakarta Selatan", 105, 28, {
    align: "center",
  });
  doc.text("Telp: (021) 555-1234 | Email: info@sajiwarestaurant.com", 105, 34, {
    align: "center",
  });

  // Garis pemisah
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 38, 195, 38);

  // Judul Laporan
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text("SALES REPORT", 105, 48, { align: "center" });

  // Informasi Laporan
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated on: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}`,
    105,
    55,
    { align: "center" }
  );

  // Informasi Filter
  let yPos = 65;
  if (filters.startDate || filters.endDate || filters.paymentMethod) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Report Filters:", 15, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    if (filters.startDate) {
      doc.text(
        `• Period Start: ${format(
          new Date(filters.startDate),
          "MMMM d, yyyy"
        )}`,
        20,
        yPos
      );
      yPos += 6;
    }

    if (filters.endDate) {
      doc.text(
        `• Period End: ${format(new Date(filters.endDate), "MMMM d, yyyy")}`,
        20,
        yPos
      );
      yPos += 6;
    }

    if (filters.paymentMethod) {
      doc.text(`• Payment Method: ${filters.paymentMethod}`, 20, yPos);
      yPos += 6;
    }

    yPos += 5;
  }

  // Tabel Transaksi
  const tableColumn = ["Receipt #", "Date", "Server", "Total", "Payment"];
  const tableRows = [];

  transactions.forEach((transaction) => {
    const transactionData = [
      `#${transaction.id}`,
      format(new Date(transaction.date), "MMM d, yyyy h:mm a"),
      transaction.cashier,
      `Rp ${(transaction.total || 0).toLocaleString("id-ID")}`,
      transaction.paymentMethod,
    ];
    tableRows.push(transactionData);
  });

  autoTable(doc, {
    startY: yPos,
    head: [tableColumn],
    body: tableRows,
    headStyles: {
      fillColor: [51, 51, 51],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { halign: "center" },
      1: { halign: "center" },
      3: { halign: "right" },
      4: { halign: "center" },
    },
    margin: { top: 15 },
    styles: {
      overflow: "linebreak",
      fontSize: 9,
      cellPadding: 4,
    },
    theme: "grid",
  });

  // Halaman Detail Transaksi
  doc.addPage();

  // Header halaman detail
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("SAJIWA STEAK RESTAURANT", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Jl. Kiyai H. Mansyur, RT.04/RW.07, Solokanjeruk, Kec. Solokanjeruk, Kabupaten Bandung, Jawa Barat 40376",
    105,
    28,
    {
      align: "center",
    }
  );
  doc.text(
    "Telp: (0812) 6265-4555 | Email: info@sajiwarestaurant.com",
    105,
    34,
    {
      align: "center",
    }
  );

  // Garis pemisah
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 38, 195, 38);

  // Judul Detail
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("TRANSACTION DETAILS", 105, 48, { align: "center" });

  let detailYPos = 60;

  // Loop untuk setiap transaksi
  transactions.forEach((transaction, index) => {
    // Cek apakah perlu halaman baru
    if (detailYPos > 250) {
      doc.addPage();
      detailYPos = 20;
    }

    // Box untuk header transaksi
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(15, detailYPos - 5, 180, 12, 2, 2, "F");

    // Header transaksi
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(
      `Receipt #${transaction.id} - ${format(
        new Date(transaction.date),
        "MMM d, yyyy h:mm a"
      )}`,
      20,
      detailYPos + 2
    );
    doc.text(`Server: ${transaction.cashier}`, 150, detailYPos + 2);
    detailYPos += 15;

    // Tabel item transaksi
    if (transaction.items && transaction.items.length > 0) {
      const itemColumns = ["Item", "Qty", "Price", "Subtotal"];
      const itemRows = [];

      transaction.items.forEach((item) => {
        // Pastikan semua nilai ada, jika tidak, gunakan 0
        const price = item.price || 0;
        const subtotal = item.subtotal || 0;

        const itemData = [
          item.name || "Unknown Item",
          item.quantity ? item.quantity.toString() : "1",
          `Rp ${price.toLocaleString("id-ID")}`,
          `Rp ${subtotal.toLocaleString("id-ID")}`,
        ];
        itemRows.push(itemData);
      });

      // Tambahkan total di baris terakhir
      itemRows.push([
        {
          content: "TOTAL",
          colSpan: 3,
          styles: { fontStyle: "bold", halign: "right" },
        },
        {
          content: `Rp ${(transaction.total || 0).toLocaleString("id-ID")}`,
          styles: { fontStyle: "bold", halign: "right" },
        },
      ]);

      autoTable(doc, {
        startY: detailYPos,
        head: [itemColumns],
        body: itemRows,
        headStyles: {
          fillColor: [80, 80, 80],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { halign: "center", cellWidth: 20 },
          2: { halign: "right", cellWidth: 40 },
          3: { halign: "right", cellWidth: 40 },
        },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9, cellPadding: 3 },
        theme: "grid",
      });

      detailYPos = doc.lastAutoTable.finalY + 15;
    } else {
      // Jika tidak ada item, tampilkan pesan
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text("No items found for this transaction", 105, detailYPos + 5, {
        align: "center",
      });
      detailYPos += 20;
    }

    // Informasi pembayaran
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Payment Method: ${transaction.paymentMethod}`,
      20,
      detailYPos - 5
    );

    // Tambahkan catatan kaki untuk setiap transaksi
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "Thank you for dining at Sajiwa Steak Restaurant!",
      105,
      detailYPos + 5,
      { align: "center" }
    );

    detailYPos += 20;
  });

  // Footer untuk semua halaman
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

  // Simpan PDF
  doc.save(`sajiwa_sales_report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export default exportToPDF;
