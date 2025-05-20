// Import komponen yang dibutuhkan
import { NextResponse } from "next/server"; // Untuk menangani response API
import prisma from "@/lib/prisma"; // Untuk koneksi database
import { getSession } from "@/lib/auth"; // Untuk mengecek session/login user

// Fungsi GET untuk mengambil data audit log
export async function GET(request) {
  try {
    // Cek apakah user sudah login dengan mengambil session
    const session = await getSession();
    if (!session) {
      // Jika belum login, kembalikan error 401 (Unauthorized)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Cari data user berdasarkan ID di session, sekalian ambil data role-nya
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { userRoles: { include: { role: true } } },
    });

    // Jika user tidak ditemukan, kembalikan error 404
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Ambil daftar role yang dimiliki user
    const roles = user.userRoles.map((ur) => ur.role.name);
    // Cek apakah user memiliki role Admin
    const isAdmin = roles.includes("Admin");
    // Cek apakah user memiliki role Manajer
    const isManager = roles.includes("Manajer");

    // Jika bukan Admin atau Manajer, tolak akses
    if (!isAdmin && !isManager) {
      return NextResponse.json(
        { message: "Unauthorized - Only Admin or Manager can view audit logs" },
        { status: 401 }
      );
    }

    // Ambil parameter query dari URL untuk filtering dan pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1"); // Halaman ke berapa
    const limit = parseInt(url.searchParams.get("limit") || "50"); // Berapa data per halaman
    const tableName = url.searchParams.get("tableName"); // Filter berdasarkan nama tabel
    const action = url.searchParams.get("action"); // Filter berdasarkan aksi
    const userId = url.searchParams.get("userId"); // Filter berdasarkan user
    const startDate = url.searchParams.get("startDate"); // Filter dari tanggal
    const endDate = url.searchParams.get("endDate"); // Filter sampai tanggal

    // Siapkan kondisi WHERE untuk query database
    let whereClause = {};

    // Tambahkan filter nama tabel jika ada
    if (tableName) {
      whereClause.tableName = tableName;
    }

    // Tambahkan filter aksi jika ada
    if (action) {
      whereClause.action = action;
    }

    // Tambahkan filter user ID jika ada
    if (userId) {
      whereClause.userId = parseInt(userId);
    }

    // Tambahkan filter tanggal jika ada
    if (startDate || endDate) {
      whereClause.createdAt = {};

      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate); // Lebih besar atau sama dengan tanggal mulai
      }

      if (endDate) {
        whereClause.createdAt.lte = new Date(`${endDate}T23:59:59`); // Lebih kecil atau sama dengan tanggal akhir
      }
    }

    // Hitung total data untuk keperluan pagination
    const totalLogs = await prisma.auditLog.count({
      where: whereClause,
    });

    // Ambil data audit log sesuai filter dan pagination
    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            username: true,
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Urutkan dari yang terbaru
      },
      skip: (page - 1) * limit, // Lewati data sesuai halaman
      take: limit, // Ambil sejumlah limit data
    });

    // Format data untuk response API
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      description: log.description,
      tableName: log.tableName,
      recordId: log.recordId,
      oldData: log.oldData,
      newData: log.newData,
      createdAt: log.createdAt,
      user: {
        id: log.userId,
        username: log.user?.username || "Unknown",
        role: log.user?.userRoles[0]?.role.name || "Unknown",
      },
    }));

    // Kirim response berhasil dengan data dan info pagination
    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        total: totalLogs,
        page,
        limit,
        totalPages: Math.ceil(totalLogs / limit),
      },
    });
  } catch (error) {
    // Jika terjadi error, log ke console dan kirim response error
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { message: "Internal server error", errorDetails: error.message },
      { status: 500 }
    );
  }
}
