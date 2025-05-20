// Import komponen yang diperlukan
import { NextResponse } from "next/server"; // Untuk menangani response API
import prisma from "@/lib/prisma"; // Untuk koneksi database
import { getSession } from "@/lib/auth"; // Untuk mengecek session/login user
import { startOfDay, endOfDay, subDays, format } from "date-fns"; // Untuk manipulasi tanggal

// Fungsi GET untuk mengambil laporan penjualan
export async function GET(request) {
  try {
    // Cek apakah user sudah login dengan mengambil session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Cek role user dengan mengambil data user dan relasinya
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { userRoles: { include: { role: true } } }, // Include relasi role
    });
    const roles = user.userRoles.map((ur) => ur.role.name); // Ambil daftar role

    // Validasi role: hanya Admin/Manajer yang boleh mengakses
    if (!roles.includes("Admin") && !roles.includes("Manajer")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ambil parameter dari URL
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate"); // Tanggal awal
    const endDate = url.searchParams.get("endDate"); // Tanggal akhir
    const period = url.searchParams.get("period") || "daily"; // Periode laporan (default: harian)

    // Set rentang waktu laporan
    if (startDate && endDate) {
      start = startOfDay(new Date(startDate)); // Mulai dari awal hari startDate
      end = endOfDay(new Date(endDate)); // Sampai akhir hari endDate
    } else {
      end = endOfDay(new Date()); // Jika tidak ada tanggal, gunakan hari ini
      start = startOfDay(subDays(end, 30)); // Dan 30 hari ke belakang
    }

    // Ambil data transaksi dari database
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: start, // Tanggal >= start
          lte: end, // Tanggal <= end
        },
      },
      include: {
        transactionItems: { include: { product: true } }, // Include item dan produk
      },
      orderBy: { date: "asc" }, // Urutkan berdasarkan tanggal
    });

    // Proses data penjualan per tanggal
    const salesByDate = {};
    transactions.forEach((transaction) => {
      const dateKey = format(transaction.date, "yyyy-MM-dd"); // Format tanggal
      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = { date: dateKey, sales: 0, orders: 0 }; // Inisialisasi data
      }
      salesByDate[dateKey].sales += transaction.totalAmount; // Tambah total penjualan
      salesByDate[dateKey].orders += 1; // Tambah jumlah order
    });
    const salesData = Object.values(salesByDate); // Konversi ke array

    // Hitung total penjualan dan order
    const totalSales = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalOrders = transactions.length;

    // Analisis produk terlaris
    const productSales = {};
    transactions.forEach((transaction) => {
      transaction.transactionItems.forEach((item) => {
        const productId = item.product.id;
        if (!productSales[productId]) {
          productSales[productId] = {
            id: productId,
            name: item.product.name,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[productId].quantity += item.quantity; // Tambah jumlah terjual
        productSales[productId].revenue += item.subtotal; // Tambah pendapatan
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity) // Urutkan berdasarkan quantity
      .slice(0, 10); // Ambil 10 teratas

    // Analisis kategori terlaris
    const categorySales = {};
    transactions.forEach((transaction) => {
      transaction.transactionItems.forEach((item) => {
        const category = item.product.category || "Uncategorized"; // Kategori default
        if (!categorySales[category]) {
          categorySales[category] = { name: category, quantity: 0, revenue: 0 };
        }
        categorySales[category].quantity += item.quantity; // Tambah jumlah terjual
        categorySales[category].revenue += item.subtotal; // Tambah pendapatan
      });
    });
    const categoryData = Object.values(categorySales);

    // Catat aktivitas pembuatan laporan ke audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id, // ID user yang membuat laporan
        action: "REPORT", // Tipe aksi
        description: `Generated sales report from ${format(
          start,
          "yyyy-MM-dd"
        )} to ${format(end, "yyyy-MM-dd")}`, // Deskripsi laporan
        tableName: "Report", // Nama tabel
        recordId: 0, // ID record (0 karena bukan record spesifik)
        newData: JSON.stringify({
          // Data laporan
          startDate: start,
          endDate: end,
          totalSales,
          totalOrders,
        }),
      },
    });

    // Kembalikan hasil laporan
    return NextResponse.json({
      summary: {
        // Ringkasan
        totalSales,
        totalOrders,
        averageSale: totalOrders > 0 ? totalSales / totalOrders : 0, // Rata-rata per order
        startDate: start,
        endDate: end,
      },
      salesData, // Data penjualan per tanggal
      topProducts, // Produk terlaris
      categoryData, // Kategori terlaris
    });
  } catch (error) {
    // Jika terjadi error
    console.error("Error generating sales report:", error); // Log error
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
