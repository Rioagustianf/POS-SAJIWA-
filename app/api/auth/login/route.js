// Import komponen yang dibutuhkan
import { NextResponse } from "next/server"; // Untuk menangani response API
import bcrypt from "bcryptjs"; // Untuk enkripsi password
import prisma from "@/lib/prisma"; // Untuk koneksi database
import { signJWT } from "@/lib/auth"; // Untuk membuat JWT token
import { table } from "console"; // Import yang tidak digunakan, bisa dihapus

// Fungsi POST untuk handAle login
export async function POST(request) {
  try {
    // Ambil username dan password dari request body
    const { username, password } = await request.json();

    // Cari user berdasarkan username dan ambil data role-nya
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        role: true, // relasi baru
      },
    });

    // Validasi user dan password menggunakan bcrypt
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Ambil role yang dimiliki user
    const roles = user.role ? [user.role.name] : [];

    // Siapkan data session untuk JWT
    const session = {
      id: user.id,
      username: user.username,
      roles: roles,
    };

    // Generate token JWT dengan data session
    const token = await signJWT(session);

    // Siapkan response dengan data user
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          roles: roles,
        },
      },
      { status: 200 }
    );

    // Set cookie session dengan JWT token
    response.cookies.set({
      name: "session", // Nama cookie
      value: token, // Nilai token
      httpOnly: true, // Hanya bisa diakses via HTTP
      path: "/", // Path cookie
      secure: process.env.NODE_ENV === "production", // HTTPS only di production
      maxAge: 60 * 60 * 24, // Expired dalam 1 hari
    });

    // Catat aktivitas login ke audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id, // ID user yang login
        action: "LOGIN", // Tipe aksi
        description: `User ${user.username} logged in`, // Deskripsi aksi
        tableName: "User", // Nama tabel yang terkait
        recordId: user.id, // ID record yang terkait
      },
    });

    // Kembalikan response
    return response;
  } catch (error) {
    // Handle error dan log ke console
    console.error("Login error:", error);
    // Kembalikan response error
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
