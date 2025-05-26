// Import komponen yang dibutuhkan
import { NextResponse } from "next/server"; // Untuk menangani response API
import prisma from "@/lib/prisma"; // Untuk koneksi database
import { getSession } from "@/lib/auth"; // Untuk mengecek session/login user

// Fungsi GET untuk mengambil semua transaksi (kasir hanya lihat miliknya, admin/manajer bisa lihat semua)
export async function GET(request) {
  try {
    // Cek apakah user sudah login dengan mengambil session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ambil data user beserta rolenya
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { role: true }, // relasi baru
    });
    const roles = user.role ? [user.role.name] : [];
    const isAdmin = roles.includes("Admin");
    const isManager = roles.includes("Manajer");

    // Set filter berdasarkan role
    let whereClause = {};
    if (!isAdmin && !isManager) {
      whereClause = { userId: session.id }; // Kasir hanya lihat transaksinya sendiri
    }

    // Ambil data transaksi dari database
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        user: { select: { username: true } }, // Include data kasir
        transactionItems: {
          include: { product: { select: { name: true, price: true } } }, // Include data produk
        },
      },
      orderBy: { date: "desc" }, // Urutkan dari yang terbaru
      take: 50, // Batasi 50 transaksi
    });

    // Transform data transaksi ke format yang diinginkan
    const transformedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      date: transaction.date
        ? new Date(transaction.date).toISOString()
        : new Date().toISOString(), // Format tanggal
      cashier: transaction.user?.username || "Unknown Cashier", // Nama kasir
      total: transaction.totalAmount || 0, // Total transaksi
      paymentMethod: transaction.paymentMethod || "Unknown", // Metode pembayaran
      items: transaction.transactionItems.map((item) => ({
        id: item.id,
        name: item.product?.name || "Unknown Product", // Nama produk
        quantity: item.quantity || 0, // Jumlah item
        subtotal: item.subtotal || 0, // Subtotal item
      })),
    }));

    return NextResponse.json(transformedTransactions); // Kembalikan data transaksi
  } catch (error) {
    console.error("Detailed Error Fetching Transactions:", error); // Log error ke console
    return NextResponse.json(
      { message: "Internal server error", errorDetails: error.message },
      { status: 500 }
    );
  }
}

// Fungsi POST untuk membuat transaksi baru
export async function POST(request) {
  try {
    // Cek apakah user sudah login dengan mengambil session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ambil dan validasi data dari request body
    const data = await request.json();
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json(
        { message: "Items are required" },
        { status: 400 }
      );
    }

    // Jalankan transaksi database atomik
    const result = await prisma.$transaction(async (prisma) => {
      // Buat transaksi baru
      const transaction = await prisma.transaction.create({
        data: {
          userId: session.id, // ID kasir
          totalAmount: data.totalAmount, // Total transaksi
          paymentMethod: data.paymentMethod, // Metode pembayaran
          status: "completed", // Status transaksi
          createdById: session.id, // ID pembuat
          updatedById: session.id, // ID pengupdate
        },
      });

      // Buat item transaksi dan update stok produk
      const items = await Promise.all(
        data.items.map(async (item) => {
          // Cek ketersediaan produk
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
          });
          if (!product) {
            throw new Error(`Product with ID ${item.productId} not found`);
          }
          // Cek stok produk
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product: ${product.name}`);
          }
          // Update stok produk
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: product.stock - item.quantity, // Kurangi stok
              updatedById: session.id, // ID pengupdate
            },
          });
          // Buat item transaksi
          return prisma.transactionItem.create({
            data: {
              transactionId: transaction.id, // ID transaksi
              productId: item.productId, // ID produk
              quantity: item.quantity, // Jumlah item
              subtotal: item.subtotal, // Subtotal item
            },
          });
        })
      );

      // Catat aktivitas ke audit log
      await prisma.auditLog.create({
        data: {
          userId: session.id, // ID user
          action: "CREATE", // Tipe aksi
          description: `Created transaction with ID: ${transaction.id}`, // Deskripsi
          tableName: "Transaction", // Nama tabel
          recordId: transaction.id, // ID record
          newData: JSON.stringify({ transaction, items: data.items }), // Data transaksi
        },
      });

      return { transaction, items }; // Kembalikan hasil transaksi
    });

    return NextResponse.json(result, { status: 201 }); // Response sukses
  } catch (error) {
    console.error("Error creating transaction:", error); // Log error ke console
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
