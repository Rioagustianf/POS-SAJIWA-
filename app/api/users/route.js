import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET: Ambil semua user dengan role mereka
export async function GET(request) {
  try {
    // Ambil session user
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ambil data user dan role-nya
    const currentUser = await prisma.user.findUnique({
      where: { id: session.id },
      include: { userRoles: { include: { role: true } } },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Cek apakah user memiliki role Admin atau Manajer
    const roles = currentUser.userRoles.map((ur) => ur.role.name);
    if (!roles.includes("Admin") && !roles.includes("Manajer")) {
      return NextResponse.json(
        { message: "Unauthorized - Only Admin or Manager can view users" },
        { status: 401 }
      );
    }

    // Ambil semua user dengan role mereka
    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        username: "asc",
      },
    });

    // Format data user untuk response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.userRoles.length > 0 ? user.userRoles[0].role.name : "Unknown",
      roles: user.userRoles.map((ur) => ur.role.name),
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Tambah user baru
export async function POST(request) {
  try {
    // Ambil session user
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ambil data user dan role-nya
    const currentUser = await prisma.user.findUnique({
      where: { id: session.id },
      include: { userRoles: { include: { role: true } } },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Cek apakah user memiliki role Admin atau Manajer
    const roles = currentUser.userRoles.map((ur) => ur.role.name);
    if (!roles.includes("Admin") && !roles.includes("Manajer")) {
      return NextResponse.json(
        { message: "Unauthorized - Only Admin or Manager can add users" },
        { status: 401 }
      );
    }

    // Ambil data dari request
    const data = await request.json();
    if (!data.username || !data.password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    // Cek apakah username sudah ada
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Cari role ID berdasarkan nama role
    const roleName = data.role || "CASHIER";
    const role = await prisma.role.findFirst({
      where: { name: roleName },
    });

    if (!role) {
      return NextResponse.json(
        { message: "Invalid role specified" },
        { status: 400 }
      );
    }

    // Buat user baru
    const newUser = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        userRoles: {
          create: {
            roleId: role.id,
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Catat ke audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        description: `Created user: ${data.username}`,
        tableName: "User",
        recordId: newUser.id,
        newData: JSON.stringify({
          id: newUser.id,
          username: newUser.username,
          role: roleName,
        }),
      },
    });

    // Format response
    const formattedUser = {
      id: newUser.id,
      username: newUser.username,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
      role:
        newUser.userRoles.length > 0
          ? newUser.userRoles[0].role.name
          : "Unknown",
      roles: newUser.userRoles.map((ur) => ur.role.name),
    };

    return NextResponse.json(formattedUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
