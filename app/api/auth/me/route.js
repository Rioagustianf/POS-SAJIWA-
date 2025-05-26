// Import komponen yang dibutuhkan
import { NextResponse } from "next/server"; // Untuk menangani response API
import prisma from "@/lib/prisma"; // Untuk koneksi database
import { getSession } from "@/lib/auth"; // Untuk mengecek session/login user

// Fungsi GET untuk mengambil data user yang sedang login
export async function GET() {
  try {
    // Cek apakah user sudah login dengan mengambil session
    const session = await getSession();

    // Jika belum login, kembalikan error 401 (Unauthorized)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Cari data user berdasarkan ID di session, sekalian ambil data role-nya
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { role: true },
    });

    // Jika user tidak ditemukan, kembalikan error 404
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Ambil daftar role yang dimiliki user
    const roles = user.role ? [user.role.name] : [];

    // Kembalikan data user dalam format yang diharapkan oleh AdminLayout
    return NextResponse.json(
      {
        user: {
          id: user.id,
          username: user.username,
          roles: roles,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Jika terjadi error, log ke console dan kirim response error
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
