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
      include: { userRoles: { include: { role: true } } }, // Include relasi role
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Validasi role: hanya Admin/Manajer yang boleh melihat daftar user
    const roles = currentUser.userRoles.map((ur) => ur.role.name); // Ambil daftar role
    if (!roles.includes("Admin") && !roles.includes("Manajer")) {
      return NextResponse.json(
        { message: "Unauthorized - Only Admin or Manager can view users" },
        { status: 401 }
      );
    }

    // Ambil semua user dengan role mereka dari database
    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true, // Include data role
          },
        },
      },
      orderBy: {
        username: "asc", // Urutkan berdasarkan username
      },
    });

    // Format data user untuk response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.userRoles.length > 0 ? user.userRoles[0].role.name : "Unknown", // Role utama
      roles: user.userRoles.map((ur) => ur.role.name), // Semua role
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
      include: { userRoles: { include: { role: true } } }, // Include relasi role
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Validasi role: hanya Admin/Manajer yang boleh membuat user
    const roles = currentUser.userRoles.map((ur) => ur.role.name); // Ambil daftar role
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

    // Cek apakah username sudah digunakan
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
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
    const roleName = data.role || "CASHIER"; // Default role: CASHIER
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
        userRoles: {
          create: {
            roleId: role.id, // Assign role ke user
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: true, // Include data role
          },
        },
      },
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
      role:
        newUser.userRoles.length > 0
          ? newUser.userRoles[0].role.name
          : "Unknown", // Role utama
      roles: newUser.userRoles.map((ur) => ur.role.name), // Semua role
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
