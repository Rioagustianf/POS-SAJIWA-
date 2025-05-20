// Import komponen yang dibutuhkan
import { NextResponse } from "next/server"; // Untuk menangani response API
import prisma from "@/lib/prisma"; // Untuk koneksi database
import { getSession } from "@/lib/auth"; // Untuk mengecek session/login user

// Fungsi GET untuk mengambil detail produk berdasarkan ID
export async function GET(request, { params }) {
  try {
    const { id } = params; // Ambil ID produk dari parameter URL
    const product = await prisma.product.findUnique({
      // Cari produk berdasarkan ID
      where: { id: parseInt(id) },
    });
    if (!product) {
      // Jika produk tidak ditemukan
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(product); // Kembalikan data produk
  } catch (error) {
    console.error("Error fetching product:", error); // Log error ke console
    return NextResponse.json(
      // Kembalikan response error
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Fungsi PUT untuk update data produk (hanya Admin/Manajer)
export async function PUT(request, { params }) {
  try {
    // Cek apakah user sudah login dengan mengambil session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    // Cek role user
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { userRoles: { include: { role: true } } }, // Include relasi role
    });
    const roles = user.userRoles.map((ur) => ur.role.name); // Ambil daftar role
    if (!roles.includes("Admin") && !roles.includes("Manajer")) {
      // Validasi role
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params; // Ambil ID produk dari parameter URL
    const data = await request.json(); // Ambil data dari request body
    if (!data.name || !data.price) {
      // Validasi input yang diperlukan
      return NextResponse.json(
        { message: "Name and price are required" },
        { status: 400 }
      );
    }

    // Simpan data lama untuk audit log
    const oldProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    // Update data produk
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name, // Nama produk
        price: parseInt(data.price), // Harga produk
        stock: data.stock ? parseInt(data.stock) : 0, // Stok produk
        description: data.description || null, // Deskripsi produk
        category: data.category || null, // Kategori produk
        image: data.image || null, // URL gambar produk
        updatedById: session.id, // ID user yang update
      },
    });

    // Catat perubahan ke audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id, // ID user yang melakukan update
        action: "UPDATE", // Tipe aksi
        description: `Updated product: ${data.name}`, // Deskripsi aksi
        tableName: "Product", // Nama tabel
        recordId: product.id, // ID record yang diupdate
        oldData: JSON.stringify(oldProduct), // Data sebelum update
        newData: JSON.stringify(product), // Data setelah update
      },
    });

    return NextResponse.json(product); // Kembalikan data produk yang sudah diupdate
  } catch (error) {
    console.error("Error updating product:", error); // Log error ke console
    return NextResponse.json(
      // Kembalikan response error
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Fungsi DELETE untuk menghapus produk (hanya Manajer)
export async function DELETE(request, { params }) {
  try {
    // Cek apakah user sudah login dengan mengambil session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    // Cek role user
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { userRoles: { include: { role: true } } }, // Include relasi role
    });
    const roles = user.userRoles.map((ur) => ur.role.name); // Ambil daftar role
    if (!roles.includes("Manajer")) {
      // Validasi role Manajer
      return NextResponse.json(
        { message: "Unauthorized - only Manager can delete products" },
        { status: 401 }
      );
    }

    const { id } = params; // Ambil ID produk dari parameter URL
    // Pastikan produk ada
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });
    if (!product) {
      // Jika produk tidak ditemukan
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // Pastikan produk tidak dipakai di transaksi
    const transactionItems = await prisma.transactionItem.findMany({
      where: { productId: parseInt(id) },
    });
    if (transactionItems.length > 0) {
      // Jika produk masih dipakai di transaksi
      return NextResponse.json(
        { message: "Cannot delete product that is used in transactions" },
        { status: 400 }
      );
    }

    // Catat penghapusan ke audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id, // ID user yang menghapus
        action: "DELETE", // Tipe aksi
        description: `Deleted product: ${product.name}`, // Deskripsi aksi
        tableName: "Product", // Nama tabel
        recordId: product.id, // ID record yang dihapus
        oldData: JSON.stringify(product), // Data yang dihapus
      },
    });

    // Hapus produk dari database
    await prisma.product.delete({ where: { id: parseInt(id) } });

    return NextResponse.json(
      // Kembalikan response sukses
      { message: "Product deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting product:", error); // Log error ke console
    return NextResponse.json(
      // Kembalikan response error
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
