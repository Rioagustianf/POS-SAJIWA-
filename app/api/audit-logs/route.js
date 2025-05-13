import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET: Ambil semua audit logs (hanya Admin/Manajer yang bisa akses)
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ambil data user dan role-nya
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const isAdmin = roles.includes("Admin");
    const isManager = roles.includes("Manajer");

    // Hanya Admin dan Manajer yang boleh melihat audit logs
    if (!isAdmin && !isManager) {
      return NextResponse.json(
        { message: "Unauthorized - Only Admin or Manager can view audit logs" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const tableName = url.searchParams.get("tableName");
    const action = url.searchParams.get("action");
    const userId = url.searchParams.get("userId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Buat filter berdasarkan query parameters
    let whereClause = {};

    if (tableName) {
      whereClause.tableName = tableName;
    }

    if (action) {
      whereClause.action = action;
    }

    if (userId) {
      whereClause.userId = parseInt(userId);
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};

      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }

      if (endDate) {
        whereClause.createdAt.lte = new Date(`${endDate}T23:59:59`);
      }
    }

    // Hitung total records untuk pagination
    const totalLogs = await prisma.auditLog.count({
      where: whereClause,
    });

    // Ambil audit logs dengan pagination
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
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Format data untuk response
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
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { message: "Internal server error", errorDetails: error.message },
      { status: 500 }
    );
  }
}
