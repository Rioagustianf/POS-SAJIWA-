// Import komponen yang dibutuhkan
import { NextResponse } from "next/server"; // Untuk menangani response API
import prisma from "@/lib/prisma"; // Untuk koneksi database
import { getSession } from "@/lib/auth"; // Untuk mengecek session/login user

// Fungsi GET untuk mengambil detail transaksi berdasarkan ID
export async function GET(request, { params }) {
  try {
    // Cek apakah user sudah login dengan mengambil session
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params; // Ambil ID transaksi dari parameter URL

    // Ambil data transaksi beserta relasinya
    const transaction = await prisma.transaction.findUnique({
      where: { id: Number.parseInt(id) },
      include: {
        user: {
          select: {
            username: true, // Ambil username pembuat transaksi
          },
        },
        transactionItems: {
          include: {
            product: {
              select: {
                name: true, // Ambil nama produk
                price: true, // Ambil harga produk
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      // Jika transaksi tidak ditemukan
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 404 }
      );
    }

    // Cek hak akses user untuk melihat transaksi ini
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { role: true },
    });
    const roles = user.role ? [user.role.name] : [];
    const isAdmin = roles.includes("Admin");
    const isManager = roles.includes("Manajer");

    // Validasi akses: hanya Admin, Manajer, atau pemilik transaksi yang boleh melihat
    if (!isAdmin && !isManager && transaction.userId !== session.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(transaction); // Kembalikan data transaksi
  } catch (error) {
    console.error("Error fetching transaction:", error); // Log error ke console
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Fungsi DELETE untuk menghapus transaksi (hanya Admin)
export async function DELETE(request, { params }) {
  try {
    // Cek apakah user sudah login dengan mengambil session
    const session = await getSession();

    // Cek role user
    const user = await prisma.user.findUnique({
      where: { id: session?.id },
      include: { role: true },
    });
    const roles = user?.role ? [user.role.name] : [];
    const isAdmin = roles.includes("Admin");

    // Validasi akses: hanya Admin yang boleh menghapus
    if (!session || !isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params; // Ambil ID transaksi dari parameter URL

    // Cek apakah transaksi ada
    const transaction = await prisma.transaction.findUnique({
      where: { id: Number.parseInt(id) },
      include: {
        transactionItems: true, // Include item transaksi
      },
    });

    if (!transaction) {
      // Jika transaksi tidak ditemukan
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 404 }
      );
    }

    // Mulai transaksi database untuk menjaga konsistensi data
    await prisma.$transaction(async (prisma) => {
      // Kembalikan stok produk untuk setiap item
      for (const item of transaction.transactionItems) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (product) {
          // Update stok produk
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: product.stock + item.quantity }, // Tambah stok
          });
        }
      }

      // Hapus item transaksi
      await prisma.transactionItem.deleteMany({
        where: { transactionId: Number.parseInt(id) },
      });

      // Hapus transaksi
      await prisma.transaction.delete({
        where: { id: Number.parseInt(id) },
      });
    });

    return NextResponse.json(
      { message: "Transaction deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting transaction:", error); // Log error ke console
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
