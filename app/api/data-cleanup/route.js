// Import komponen yang dibutuhkan
import { NextResponse } from "next/server"; // Untuk menangani response API
import prisma from "@/lib/prisma"; // Untuk koneksi database
import { getSession } from "@/lib/auth"; // Untuk mengecek session/login user

// Fungsi POST untuk menjalankan pembersihan data
export async function POST(request) {
  try {
    // Cek apakah user sudah login dengan mengambil session
    const session = await getSession();
    if (!session) {
      // Jika belum login, kembalikan error 401 (Unauthorized)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    // Cek role user: hanya Manajer yang boleh mengakses
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { role: true }, // Include relasi role
    });

    if (user?.role?.name !== "Manajer") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Ambil tipe data dan tanggal batas dari request body
    const { type, beforeDate } = await request.json();

    // Validasi input yang diperlukan
    if (!type || !beforeDate) {
      return NextResponse.json(
        { message: "Type and beforeDate are required" },
        { status: 400 }
      );
    }

    let deleted = 0; // Variabel untuk menghitung jumlah data yang dihapus
    if (type === "transactions") {
      // Hapus transaksi dan item transaksi sebelum tanggal tertentu
      const date = new Date(beforeDate);
      // Cari transaksi lama
      const oldTransactions = await prisma.transaction.findMany({
        where: { date: { lt: date } },
        select: { id: true },
      });
      const ids = oldTransactions.map((t) => t.id);
      // Hapus item transaksi terlebih dahulu (foreign key constraint)
      await prisma.transactionItem.deleteMany({
        where: { transactionId: { in: ids } },
      });
      // Hapus transaksi
      const result = await prisma.transaction.deleteMany({
        where: { id: { in: ids } },
      });
      deleted = result.count;
    } else if (type === "auditLogs") {
      // Hapus audit log sebelum tanggal tertentu
      const date = new Date(beforeDate);
      const result = await prisma.auditLog.deleteMany({
        where: { createdAt: { lt: date } },
      });
      deleted = result.count;
    } else if (type === "inactiveProducts") {
      // Hapus produk yang tidak aktif (tanpa transaksi dalam periode tertentu)
      const date = new Date(beforeDate);
      // Cari produk tidak aktif
      const products = await prisma.product.findMany({
        where: {
          transactionItems: { none: { createdAt: { gt: date } } },
        },
        select: { id: true },
      });
      const ids = products.map((p) => p.id);
      // Hapus item transaksi terkait produk
      await prisma.transactionItem.deleteMany({
        where: { productId: { in: ids } },
      });
      // Hapus produk
      const result = await prisma.product.deleteMany({
        where: { id: { in: ids } },
      });
      deleted = result.count;
    } else if (type === "inactiveUsers") {
      // Hapus user tidak aktif (tanpa transaksi dalam periode tertentu)
      const date = new Date(beforeDate);
      // Cari user tidak aktif (kecuali Manajer)
      const users = await prisma.user.findMany({
        where: {
          transactions: { none: { date: { gt: date } } },
          role: {
            name: { not: "Manajer" }, // Jangan hapus Manajer
          },
        },
        select: { id: true },
      });
      const ids = users.map((u) => u.id);

      // Hapus audit log terkait user yang akan dihapus
      await prisma.auditLog.deleteMany({ where: { userId: { in: ids } } });

      // Hapus user
      const result = await prisma.user.deleteMany({
        where: { id: { in: ids } },
      });
      deleted = result.count;
    } else {
      // Jika tipe cleanup tidak valid
      return NextResponse.json(
        { message: "Invalid cleanup type" },
        { status: 400 }
      );
    }

    // Catat aktivitas pembersihan data ke audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id, // ID user yang melakukan cleanup
        action: "DELETE", // Tipe aksi
        description: `Data cleanup for ${type} before ${beforeDate} (${deleted} records)`, // Deskripsi aksi
        tableName: type, // Nama tabel yang dibersihkan
        recordId: 0, // ID record (0 karena bulk delete)
        oldData: null, // Data lama (null karena bulk delete)
        newData: null, // Data baru (null karena delete)
      },
    });

    // Kembalikan response sukses dengan jumlah data yang dihapus
    return NextResponse.json({
      message: `Cleanup success (${deleted} records deleted)`,
    });
  } catch (error) {
    // Jika terjadi error, log ke console dan kirim response error
    console.error("Error in data cleanup:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
