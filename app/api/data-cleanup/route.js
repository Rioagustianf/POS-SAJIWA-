import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// POST: Jalankan cleanup data
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    // Cek role: hanya Manajer yang boleh
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { userRoles: { include: { role: true } } },
    });
    const roles = user.userRoles.map((ur) => ur.role.name);
    if (!roles.includes("Manajer")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { type, beforeDate } = await request.json();

    // Validasi input
    if (!type || !beforeDate) {
      return NextResponse.json(
        { message: "Type and beforeDate are required" },
        { status: 400 }
      );
    }

    let deleted = 0;
    if (type === "transactions") {
      // Hapus transaksi dan itemnya sebelum tanggal tertentu
      const date = new Date(beforeDate);
      const oldTransactions = await prisma.transaction.findMany({
        where: { date: { lt: date } },
        select: { id: true },
      });
      const ids = oldTransactions.map((t) => t.id);
      await prisma.transactionItem.deleteMany({
        where: { transactionId: { in: ids } },
      });
      const result = await prisma.transaction.deleteMany({
        where: { id: { in: ids } },
      });
      deleted = result.count;
    } else if (type === "auditLogs") {
      const date = new Date(beforeDate);
      const result = await prisma.auditLog.deleteMany({
        where: { createdAt: { lt: date } },
      });
      deleted = result.count;
    } else if (type === "inactiveProducts") {
      // Produk tanpa transaksi selama setahun
      const date = new Date(beforeDate);
      const products = await prisma.product.findMany({
        where: {
          transactionItems: { none: { createdAt: { gt: date } } },
        },
        select: { id: true },
      });
      const ids = products.map((p) => p.id);
      await prisma.transactionItem.deleteMany({
        where: { productId: { in: ids } },
      });
      const result = await prisma.product.deleteMany({
        where: { id: { in: ids } },
      });
      deleted = result.count;
    } else if (type === "inactiveUsers") {
      // User tanpa transaksi selama setahun
      const date = new Date(beforeDate);
      const users = await prisma.user.findMany({
        where: {
          transactions: { none: { date: { gt: date } } },
          userRoles: { some: { role: { name: { not: "Manajer" } } } }, // Tidak hapus manajer
        },
        select: { id: true },
      });
      const ids = users.map((u) => u.id);
      await prisma.userRole.deleteMany({ where: { userId: { in: ids } } });
      const result = await prisma.user.deleteMany({
        where: { id: { in: ids } },
      });
      deleted = result.count;
    } else {
      return NextResponse.json(
        { message: "Invalid cleanup type" },
        { status: 400 }
      );
    }

    // Catat ke audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        description: `Data cleanup for ${type} before ${beforeDate} (${deleted} records)`,
        tableName: type,
        recordId: 0,
        oldData: null,
        newData: null,
      },
    });

    return NextResponse.json({
      message: `Cleanup success (${deleted} records deleted)`,
    });
  } catch (error) {
    console.error("Error in data cleanup:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
