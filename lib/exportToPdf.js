// Import library jsPDF untuk membuat dokumen PDF
import jsPDF from "jspdf";
// Import plugin autoTable untuk membuat tabel otomatis di PDF
import autoTable from "jspdf-autotable";
// Import fungsi format dari date-fns untuk memformat tanggal
import { format } from "date-fns";

// Fungsi utama untuk mengekspor data transaksi ke PDF
export function exportToPDF(transactions, filters = {}) {
  // Inisialisasi dokumen PDF baru
  const doc = new jsPDF();

  // Membuat header dengan logo dan nama restoran
  doc.setFontSize(22); // Set ukuran font untuk judul
  doc.setFont("helvetica", "bold"); // Set font bold
  doc.setTextColor(40, 40, 40); // Set warna teks abu-abu gelap
  doc.text("SAJIWA STEAK RESTAURANT", 105, 20, { align: "center" }); // Tulis nama restoran di tengah

  // Menambahkan informasi alamat dan kontak
  doc.setFontSize(10); // Set ukuran font lebih kecil
  doc.setFont("helvetica", "normal"); // Set font normal
  doc.setTextColor(80, 80, 80); // Set warna teks abu-abu
  doc.text("Jl. Pahlawan No. 123, Jakarta Selatan", 105, 28, {
    align: "center", // Tulis alamat di tengah
  });
  doc.text("Telp: (021) 555-1234 | Email: info@sajiwarestaurant.com", 105, 34, {
    align: "center", // Tulis kontak di tengah
  });

  // Membuat garis pemisah horizontal
  doc.setDrawColor(200, 200, 200); // Set warna garis abu-abu muda
  doc.line(15, 38, 195, 38); // Buat garis dari kiri ke kanan

  // Menambahkan judul laporan
  doc.setFontSize(16); // Set ukuran font untuk sub judul
  doc.setFont("helvetica", "bold"); // Set font bold
  doc.setTextColor(40, 40, 40); // Set warna teks abu-abu gelap
  doc.text("SALES REPORT", 105, 48, { align: "center" }); // Tulis judul laporan

  // Menambahkan tanggal pembuatan laporan
  doc.setFontSize(10); // Set ukuran font kecil
  doc.setFont("helvetica", "normal"); // Set font normal
  doc.text(
    `Generated on: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}`, // Format tanggal dan waktu
    105,
    55,
    { align: "center" } // Tulis di tengah
  );

  // Menambahkan informasi filter jika ada
  let yPos = 65; // Posisi vertikal awal untuk filter
  if (filters.startDate || filters.endDate || filters.paymentMethod) {
    doc.setFontSize(11); // Set ukuran font untuk judul filter
    doc.setFont("helvetica", "bold"); // Set font bold
    doc.text("Report Filters:", 15, yPos); // Tulis judul filter
    yPos += 7; // Geser posisi ke bawah

    doc.setFontSize(10); // Set ukuran font untuk detail filter
    doc.setFont("helvetica", "normal"); // Set font normal

    // Menambahkan filter tanggal mulai jika ada
    if (filters.startDate) {
      doc.text(
        `• Period Start: ${format(
          new Date(filters.startDate),
          "MMMM d, yyyy"
        )}`,
        20,
        yPos
      );
      yPos += 6; // Geser posisi ke bawah
    }

    // Menambahkan filter tanggal akhir jika ada
    if (filters.endDate) {
      doc.text(
        `• Period End: ${format(new Date(filters.endDate), "MMMM d, yyyy")}`,
        20,
        yPos
      );
      yPos += 6; // Geser posisi ke bawah
    }

    // Menambahkan filter metode pembayaran jika ada
    if (filters.paymentMethod) {
      doc.text(`• Payment Method: ${filters.paymentMethod}`, 20, yPos);
      yPos += 6; // Geser posisi ke bawah
    }

    yPos += 5; // Tambah spasi setelah filter
  }

  // Menyiapkan data untuk tabel transaksi
  const tableColumn = ["Receipt #", "Date", "Server", "Total", "Payment"]; // Header kolom tabel
  const tableRows = []; // Array untuk menyimpan data baris

  // Mengisi data tabel dari array transaksi
  transactions.forEach((transaction) => {
    const transactionData = [
      `#${transaction.id}`, // Nomor kuitansi
      format(new Date(transaction.date), "MMM d, yyyy h:mm a"), // Tanggal dan waktu
      transaction.cashier, // Nama kasir
      `Rp ${(transaction.total || 0).toLocaleString("id-ID")}`, // Total dengan format mata uang
      transaction.paymentMethod, // Metode pembayaran
    ];
    tableRows.push(transactionData); // Tambahkan data ke array baris
  });

  // Membuat tabel transaksi menggunakan autoTable
  autoTable(doc, {
    startY: yPos, // Posisi awal tabel
    head: [tableColumn], // Header tabel
    body: tableRows, // Isi tabel
    headStyles: {
      // Style untuk header
      fillColor: [51, 51, 51], // Warna latar belakang header
      textColor: 255, // Warna teks putih
      fontStyle: "bold", // Font tebal
      halign: "center", // Rata tengah
    },
    alternateRowStyles: {
      // Style untuk baris alternatif
      fillColor: [245, 245, 245], // Warna latar belakang abu-abu muda
    },
    columnStyles: {
      // Style untuk setiap kolom
      0: { halign: "center" }, // Rata tengah untuk kolom nomor
      1: { halign: "center" }, // Rata tengah untuk kolom tanggal
      3: { halign: "right" }, // Rata kanan untuk kolom total
      4: { halign: "center" }, // Rata tengah untuk kolom metode pembayaran
    },
    margin: { top: 15 }, // Margin atas tabel
    styles: {
      // Style umum
      overflow: "linebreak", // Penanganan overflow teks
      fontSize: 9, // Ukuran font
      cellPadding: 4, // Padding sel
    },
    theme: "grid", // Tema tabel dengan grid
  });

  // Membuat halaman baru untuk detail transaksi
  doc.addPage();

  // Membuat header untuk halaman detail
  doc.setFontSize(22); // Set ukuran font untuk judul
  doc.setFont("helvetica", "bold"); // Set font bold
  doc.text("SAJIWA STEAK RESTAURANT", 105, 20, { align: "center" }); // Tulis nama restoran

  // Menambahkan alamat lengkap restoran
  doc.setFontSize(10); // Set ukuran font kecil
  doc.setFont("helvetica", "normal"); // Set font normal
  doc.text(
    "Jl. Kiyai H. Mansyur, RT.04/RW.07, Solokanjeruk, Kec. Solokanjeruk, Kabupaten Bandung, Jawa Barat 40376",
    105,
    28,
    {
      align: "center", // Tulis alamat di tengah
    }
  );
  doc.text(
    "Telp: (0812) 6265-4555 | Email: info@sajiwarestaurant.com",
    105,
    34,
    {
      align: "center", // Tulis kontak di tengah
    }
  );

  // Membuat garis pemisah
  doc.setDrawColor(200, 200, 200); // Set warna garis abu-abu
  doc.line(15, 38, 195, 38); // Buat garis horizontal

  // Menambahkan judul detail transaksi
  doc.setFontSize(16); // Set ukuran font untuk judul
  doc.setFont("helvetica", "bold"); // Set font bold
  doc.text("TRANSACTION DETAILS", 105, 48, { align: "center" }); // Tulis judul

  let detailYPos = 60; // Posisi awal untuk detail transaksi

  // Loop untuk setiap transaksi untuk menampilkan detailnya
  transactions.forEach((transaction, index) => {
    // Cek apakah perlu halaman baru
    if (detailYPos > 250) {
      // Jika posisi sudah terlalu bawah
      doc.addPage(); // Tambah halaman baru
      detailYPos = 20; // Reset posisi ke atas
    }

    // Membuat box header untuk setiap transaksi
    doc.setFillColor(240, 240, 240); // Set warna latar belakang abu-abu muda
    doc.roundedRect(15, detailYPos - 5, 180, 12, 2, 2, "F"); // Buat kotak rounded

    // Menambahkan informasi header transaksi
    doc.setFontSize(11); // Set ukuran font
    doc.setFont("helvetica", "bold"); // Set font bold
    doc.setTextColor(40, 40, 40); // Set warna teks
    doc.text(
      `Receipt #${transaction.id} - ${format(
        new Date(transaction.date),
        "MMM d, yyyy h:mm a"
      )}`, // Nomor kuitansi dan tanggal
      20,
      detailYPos + 2
    );
    doc.text(`Server: ${transaction.cashier}`, 150, detailYPos + 2); // Nama kasir
    detailYPos += 15; // Geser posisi ke bawah

    // Membuat tabel item transaksi jika ada
    if (transaction.items && transaction.items.length > 0) {
      const itemColumns = ["Item", "Qty", "Price", "Subtotal"]; // Header kolom
      const itemRows = []; // Array untuk data item

      // Loop untuk setiap item dalam transaksi
      transaction.items.forEach((item) => {
        // Pastikan semua nilai ada, jika tidak gunakan 0
        const price = item.price || 0;
        const subtotal = item.subtotal || 0;

        // Menyiapkan data item
        const itemData = [
          item.name || "Unknown Item", // Nama item
          item.quantity ? item.quantity.toString() : "1", // Kuantitas
          `Rp ${price.toLocaleString("id-ID")}`, // Harga
          `Rp ${subtotal.toLocaleString("id-ID")}`, // Subtotal
        ];
        itemRows.push(itemData); // Tambahkan ke array
      });

      // Menambahkan baris total
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

      // Membuat tabel item menggunakan autoTable
      autoTable(doc, {
        startY: detailYPos, // Posisi awal tabel
        head: [itemColumns], // Header tabel
        body: itemRows, // Isi tabel
        headStyles: {
          // Style untuk header
          fillColor: [80, 80, 80],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          // Style untuk kolom
          0: { cellWidth: 80 }, // Lebar kolom nama item
          1: { halign: "center", cellWidth: 20 }, // Lebar dan alignment kolom kuantitas
          2: { halign: "right", cellWidth: 40 }, // Lebar dan alignment kolom harga
          3: { halign: "right", cellWidth: 40 }, // Lebar dan alignment kolom subtotal
        },
        margin: { left: 20, right: 20 }, // Margin tabel
        styles: { fontSize: 9, cellPadding: 3 }, // Style umum
        theme: "grid", // Tema tabel
      });

      detailYPos = doc.lastAutoTable.finalY + 15; // Update posisi setelah tabel
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

    // Menambahkan informasi metode pembayaran
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Payment Method: ${transaction.paymentMethod}`,
      20,
      detailYPos - 5
    );

    // Menambahkan pesan terima kasih
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "Thank you for dining at Sajiwa Steak Restaurant!",
      105,
      detailYPos + 5,
      { align: "center" }
    );

    detailYPos += 20; // Geser posisi untuk transaksi berikutnya
  });

  // Menambahkan footer di setiap halaman
  const pageCount = doc.internal.getNumberOfPages(); // Hitung jumlah halaman
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i); // Set halaman aktif
    doc.setFontSize(8); // Set ukuran font kecil
    doc.setTextColor(150, 150, 150); // Set warna teks abu-abu
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" }); // Nomor halaman
    doc.text("© 2025 Sajiwa Steak Restaurant. All rights reserved.", 105, 295, {
      align: "center", // Copyright
    });
  }

  // Simpan file PDF dengan nama yang mengandung tanggal
  doc.save(`sajiwa_sales_report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

// Export fungsi sebagai default
export default exportToPDF;
