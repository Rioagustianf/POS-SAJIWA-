import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET: Ambil detail user berdasarkan ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
    }
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
    if (
      !roles.includes("Admin") &&
      !roles.includes("Manajer") &&
      session.id !== parseInt(id)
    ) {
      return NextResponse.json(
        { message: "Unauthorized - You can only view your own profile" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Format data user untuk response
    const formattedUser = {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.userRoles.length > 0 ? user.userRoles[0].role.name : "Unknown",
      roles: user.userRoles.map((ur) => ur.role.name),
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update user
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
    }
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

    // Ambil data user yang akan diedit/dihapus
    const userTarget = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { userRoles: { include: { role: true } } },
    });
    if (!userTarget) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const targetRole =
      userTarget.userRoles.length > 0
        ? userTarget.userRoles[0].role.name
        : "Unknown";

    // Cek hak akses
    const roles = currentUser.userRoles.map((ur) => ur.role.name);
    if (roles.includes("Manajer")) {
      // Manajer bisa edit/hapus siapa saja (kecuali admin utama dihapus)
      // Tidak perlu pembatasan tambahan di sini
    } else if (roles.includes("Admin")) {
      // Admin hanya bisa edit/hapus user dengan role Admin/Kasir
      if (targetRole === "Manajer") {
        return NextResponse.json(
          { message: "Admin tidak boleh mengelola user dengan role Manajer" },
          { status: 403 }
        );
      }
    } else if (session.id !== parseInt(id)) {
      // User biasa hanya bisa edit dirinya sendiri
      return NextResponse.json(
        {
          message: "Unauthorized - You can only update/delete your own profile",
        },
        { status: 401 }
      );
    }

    // Ambil data dari request
    const data = await request.json();
    if (!data.username) {
      return NextResponse.json(
        { message: "Username is required" },
        { status: 400 }
      );
    }

    // Cek apakah username sudah ada (jika username diubah)
    const userToUpdate = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!userToUpdate) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (data.username !== userToUpdate.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: data.username },
      });

      if (existingUser) {
        return NextResponse.json(
          { message: "Username already exists" },
          { status: 400 }
        );
      }
    }

    // Simpan data lama untuk audit log
    const oldUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const oldFormattedUser = {
      id: oldUser.id,
      username: oldUser.username,
      role:
        oldUser.userRoles.length > 0
          ? oldUser.userRoles[0].role.name
          : "Unknown",
    };

    // Persiapkan data update
    const updateData = {
      username: data.username,
    };

    // Hash password jika ada
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Update role jika diperlukan dan user bukan admin utama
    if (data.role && userToUpdate.username !== "admin") {
      // Cari role ID berdasarkan nama role
      const role = await prisma.role.findFirst({
        where: { name: data.role },
      });

      if (!role) {
        return NextResponse.json(
          { message: "Invalid role specified" },
          { status: 400 }
        );
      }

      // Hapus role lama
      await prisma.userRole.deleteMany({
        where: { userId: parseInt(id) },
      });

      // Tambah role baru
      await prisma.userRole.create({
        data: {
          userId: parseInt(id),
          roleId: role.id,
        },
      });

      // Ambil data user yang sudah diupdate dengan role baru
      const refreshedUser = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      updatedUser.userRoles = refreshedUser.userRoles;
    }

    // Catat ke audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        description: `Updated user: ${data.username}`,
        tableName: "User",
        recordId: updatedUser.id,
        oldData: JSON.stringify(oldFormattedUser),
        newData: JSON.stringify({
          id: updatedUser.id,
          username: updatedUser.username,
          role:
            updatedUser.userRoles.length > 0
              ? updatedUser.userRoles[0].role.name
              : "Unknown",
        }),
      },
    });

    // Format response
    const formattedUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      role:
        updatedUser.userRoles.length > 0
          ? updatedUser.userRoles[0].role.name
          : "Unknown",
      roles: updatedUser.userRoles.map((ur) => ur.role.name),
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus user
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
    }
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

    // Ambil data user yang akan diedit/dihapus
    const userTarget = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { userRoles: { include: { role: true } } },
    });
    if (!userTarget) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const targetRole =
      userTarget.userRoles.length > 0
        ? userTarget.userRoles[0].role.name
        : "Unknown";

    // Cek hak akses
    const roles = currentUser.userRoles.map((ur) => ur.role.name);
    if (roles.includes("Manajer")) {
      // Manajer bisa edit/hapus siapa saja (kecuali admin utama dihapus)
      // Tidak perlu pembatasan tambahan di sini
    } else if (roles.includes("Admin")) {
      // Admin hanya bisa edit/hapus user dengan role Admin/Kasir
      if (targetRole === "Manajer") {
        return NextResponse.json(
          { message: "Admin tidak boleh mengelola user dengan role Manajer" },
          { status: 403 }
        );
      }
    } else if (session.id !== parseInt(id)) {
      // User biasa hanya bisa edit dirinya sendiri
      return NextResponse.json(
        {
          message: "Unauthorized - You can only update/delete your own profile",
        },
        { status: 401 }
      );
    }

    // Cek apakah ini admin terakhir
    const isAdmin = userTarget.userRoles.some((ur) => ur.role.name === "Admin");
    if (isAdmin) {
      const adminCount = await prisma.user.count({
        where: {
          userRoles: {
            some: {
              role: {
                name: "Admin",
              },
            },
          },
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { message: "Cannot delete the last admin user" },
          { status: 400 }
        );
      }
    }

    // Simpan data untuk audit log
    const oldFormattedUser = {
      id: userTarget.id,
      username: userTarget.username,
      role: targetRole,
    };

    // Hapus user roles terlebih dahulu
    await prisma.userRole.deleteMany({
      where: { userId: parseInt(id) },
    });

    // Hapus user
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    // Catat ke audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        description: `Deleted user: ${userTarget.username}`,
        tableName: "User",
        recordId: parseInt(id),
        oldData: JSON.stringify(oldFormattedUser),
      },
    });

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
