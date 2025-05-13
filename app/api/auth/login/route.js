import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signJWT } from "@/lib/auth";
import { table } from "console";

export async function POST(request) {
  try {
    // Ambil username dan password dari request body
    const { username, password } = await request.json();

    // Cari user dan ambil roles-nya
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    // Validasi user dan password
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Ambil daftar role user
    const roles = user.userRoles.map((ur) => ur.role.name);

    // Buat data session untuk JWT
    const session = {
      id: user.id,
      username: user.username,
      roles: roles,
    };

    // Generate JWT token
    const token = await signJWT(session);

    // Set cookie session
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
    response.cookies.set({
      name: "session",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 hari
    });

    // Catat aktivitas login ke audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        description: `User ${user.username} logged in`,
        tableName: "User", // tambahkan ini
        recordId: user.id, // opsional
      },
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
