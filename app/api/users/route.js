// Import komponen yang diperlukan
import { NextResponse } from "next/server"; // Untuk menangani response API
import prisma from "@/lib/prisma"; // Untuk koneksi database
import { getSession } from "@/lib/auth"; // Untuk mengecek session/login user
import bcrypt from "bcryptjs"; // Untuk hashing password

// Fungsi GET untuk mengambil semua user dengan role mereka
export async function GET(request) {
  try {
    // Cek apakah user sudah login dengan mengambil session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ambil data user beserta rolenya
    const currentUser = await prisma.user.findUnique({
      where: { id: session.id },
      include: { role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Validasi role: hanya Admin/Manajer yang boleh melihat daftar user
    const roles = currentUser.role ? [currentUser.role.name] : [];
    if (!roles.includes("Admin") && !roles.includes("Manajer")) {
      return NextResponse.json(
        { message: "Unauthorized - Only Admin or Manager can view users" },
        { status: 401 }
      );
    }

    // Ambil semua user dengan role mereka dari database
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: { role: true },
      orderBy: { username: "asc" },
    });

    // Format data user untuk response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role ? user.role.name : "Unknown",
      roles: user.role ? [user.role.name] : [],
    }));

    return NextResponse.json(formattedUsers); // Kembalikan data user
  } catch (error) {
    console.error("Error fetching users:", error); // Log error ke console
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Fungsi POST untuk membuat user baru
export async function POST(request) {
  try {
    // Cek apakah user sudah login dengan mengambil session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ambil data user beserta rolenya
    const currentUser = await prisma.user.findUnique({
      where: { id: session.id },
      include: { role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Validasi role: hanya Admin/Manajer yang boleh membuat user
    const roles = currentUser.role ? [currentUser.role.name] : [];
    if (!roles.includes("Admin") && !roles.includes("Manajer")) {
      return NextResponse.json(
        { message: "Unauthorized - Only Admin or Manager can add users" },
        { status: 401 }
      );
    }

    // Ambil dan validasi data dari request body
    const data = await request.json();
    if (!data.username || !data.password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    // Cek apakah username sudah digunakan oleh user aktif
    const existingUser = await prisma.user.findFirst({
      where: { username: data.username, isActive: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 400 }
      );
    }

    // Hash password untuk keamanan
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Cari role yang akan diberikan ke user baru
    const roleName = data.role || "Kasir"; // Default role: Kasir
    // Jika admin, tidak boleh menambah user dengan role Manajer
    if (
      roles.includes("Admin") &&
      !roles.includes("Manajer") &&
      roleName === "Manajer"
    ) {
      return NextResponse.json(
        { message: "Admin tidak boleh menambah user dengan role Manajer" },
        { status: 403 }
      );
    }
    const role = await prisma.role.findFirst({
      where: { name: roleName },
    });

    if (!role) {
      return NextResponse.json(
        { message: "Invalid role specified" },
        { status: 400 }
      );
    }

    // Buat user baru dengan rolenya
    const newUser = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        roleId: role.id,
      },
      include: { role: true },
    });

    // Catat aktivitas pembuatan user ke audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id, // ID user yang membuat
        action: "CREATE", // Tipe aksi
        description: `Created user: ${data.username}`, // Deskripsi
        tableName: "User", // Nama tabel
        recordId: newUser.id, // ID record
        newData: JSON.stringify({
          // Data user baru
          id: newUser.id,
          username: newUser.username,
          role: roleName,
        }),
      },
    });

    // Format data user untuk response
    const formattedUser = {
      id: newUser.id,
      username: newUser.username,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
      role: newUser.role ? newUser.role.name : "Unknown",
      roles: newUser.role ? [newUser.role.name] : [],
    };

    return NextResponse.json(formattedUser, { status: 201 }); // Response sukses
  } catch (error) {
    console.error("Error creating user:", error); // Log error ke console
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
