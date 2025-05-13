import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET: Ambil semua transaksi (kasir hanya lihat miliknya, admin/manajer bisa lihat semua)
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { userRoles: { include: { role: true } } },
    });
    const roles = user.userRoles.map((ur) => ur.role.name);
    const isAdmin = roles.includes("Admin");
    const isManager = roles.includes("Manajer");

    let whereClause = {};
    if (!isAdmin && !isManager) {
      whereClause = { userId: session.id };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        user: { select: { username: true } },
        transactionItems: {
          include: { product: { select: { name: true, price: true } } },
        },
      },
      orderBy: { date: "desc" },
      take: 50,
    });

    const transformedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      date: transaction.date
        ? new Date(transaction.date).toISOString()
        : new Date().toISOString(),
      cashier: transaction.user?.username || "Unknown Cashier",
      total: transaction.totalAmount || 0,
      paymentMethod: transaction.paymentMethod || "Unknown",
      items: transaction.transactionItems.map((item) => ({
        id: item.id,
        name: item.product?.name || "Unknown Product",
        quantity: item.quantity || 0,
        subtotal: item.subtotal || 0,
      })),
    }));

    return NextResponse.json(transformedTransactions);
  } catch (error) {
    console.error("Detailed Error Fetching Transactions:", error);
    return NextResponse.json(
      { message: "Internal server error", errorDetails: error.message },
      { status: 500 }
    );
  }
}

// POST: Buat transaksi baru
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json(
        { message: "Items are required" },
        { status: 400 }
      );
    }

    // Jalankan transaksi database atomik
    const result = await prisma.$transaction(async (prisma) => {
      // Buat transaksi
      const transaction = await prisma.transaction.create({
        data: {
          userId: session.id,
          totalAmount: data.totalAmount,
          paymentMethod: data.paymentMethod,
          status: "completed",
          createdById: session.id,
          updatedById: session.id,
        },
      });

      // Buat item transaksi & update stok produk
      const items = await Promise.all(
        data.items.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
          });
          if (!product) {
            throw new Error(`Product with ID ${item.productId} not found`);
          }
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product: ${product.name}`);
          }
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: product.stock - item.quantity,
              updatedById: session.id,
            },
          });
          return prisma.transactionItem.create({
            data: {
              transactionId: transaction.id,
              productId: item.productId,
              quantity: item.quantity,
              subtotal: item.subtotal,
            },
          });
        })
      );

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: "CREATE",
          description: `Created transaction with ID: ${transaction.id}`,
          tableName: "Transaction",
          recordId: transaction.id,
          newData: JSON.stringify({ transaction, items: data.items }),
        },
      });

      return { transaction, items };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
