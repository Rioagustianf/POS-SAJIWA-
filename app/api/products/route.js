// Import komponen yang dibutuhkan
import { NextResponse } from "next/server"; // Untuk menangani response API
import prisma from "@/lib/prisma"; // Untuk koneksi database
import { getSession } from "@/lib/auth"; // Untuk mengecek session/login user

// Fungsi GET untuk mengambil semua data produk
export async function GET(request) {
  try {
    // Ambil semua produk dari database, urutkan berdasarkan nama (ascending)
    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(products); // Kembalikan daftar produk
  } catch (error) {
    console.error("Error fetching products:", error); // Log error ke console
    return NextResponse.json(
      { message: "Internal server error" }, // Kembalikan response error
      { status: 500 }
    );
  }
}

// Fungsi POST untuk menambah produk baru (hanya Admin/Manajer)
export async function POST(request) {
  try {
    // Cek apakah user sudah login dengan mengambil session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

     // PERBAIKAN: Query yang benar untuk mengambil user dengan relasi role
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { 
        role: true  // Gunakan 'role' bukan 'roleId' atau 'roles'
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    // PERBAIKAN: Akses role yang benar
    const userRole = user.role?.name; // Akses nama role
    
    // Validasi role: hanya Admin/Manajer yang boleh upload
    if (!userRole || (userRole !== "Admin" && userRole !== "Manajer")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ambil data produk dari request body
    const data = await request.json();
    if (!data.name || !data.price) {
      // Validasi input yang diperlukan
      return NextResponse.json(
        { message: "Name and price are required" },
        { status: 400 }
      );
    }

    // Buat produk baru di database
    const product = await prisma.product.create({
      data: {
        name: data.name, // Nama produk
        price: parseInt(data.price), // Harga (konversi ke integer)
        stock: data.stock ? parseInt(data.stock) : 0, // Stok (default 0)
        description: data.description || null, // Deskripsi (opsional)
        category: data.category || null, // Kategori (opsional)
        image: data.image || null, // URL gambar (opsional)
        createdById: session.id, // ID user yang membuat
        updatedById: session.id, // ID user yang terakhir update
      },
    });

    // Catat aktivitas pembuatan produk ke audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id, // ID user yang membuat
        action: "CREATE", // Tipe aksi
        description: `Created product: ${data.name}`, // Deskripsi aksi
        tableName: "Product", // Nama tabel
        recordId: product.id, // ID record yang dibuat
        newData: JSON.stringify(product), // Data produk yang dibuat
      },
    });

    return NextResponse.json(product, { status: 201 }); // Kembalikan data produk yang dibuat
  } catch (error) {
    console.error("Error creating product:", error); // Log error ke console
    return NextResponse.json(
      { message: "Internal server error" }, // Kembalikan response error
      { status: 500 }
    );
  }
}
