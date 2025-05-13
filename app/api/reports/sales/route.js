import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Cek role user (Admin/Manajer)
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { userRoles: { include: { role: true } } },
    });
    const roles = user.userRoles.map((ur) => ur.role.name);
    if (!roles.includes("Admin") && !roles.includes("Manajer")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const period = url.searchParams.get("period") || "daily";

    let start, end;
    if (startDate && endDate) {
      start = startOfDay(new Date(startDate));
      end = endOfDay(new Date(endDate));
    } else {
      end = endOfDay(new Date());
      start = startOfDay(subDays(end, 30));
    }

    // Perbaikan: Mengubah 'items' menjadi 'transactionItems' sesuai dengan skema Prisma
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        transactionItems: { include: { product: true } },
      },
      orderBy: { date: "asc" },
    });

    // Proses data laporan
    const salesByDate = {};
    transactions.forEach((transaction) => {
      const dateKey = format(transaction.date, "yyyy-MM-dd");
      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = { date: dateKey, sales: 0, orders: 0 };
      }
      salesByDate[dateKey].sales += transaction.totalAmount;
      salesByDate[dateKey].orders += 1;
    });
    const salesData = Object.values(salesByDate);

    const totalSales = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalOrders = transactions.length;

    // Produk terlaris
    const productSales = {};
    transactions.forEach((transaction) => {
      // Perbaikan: Mengubah 'items' menjadi 'transactionItems' sesuai dengan skema Prisma
      transaction.transactionItems.forEach((item) => {
        const productId = item.product.id;
        if (!productSales[productId]) {
          productSales[productId] = {
            id: productId,
            name: item.product.name,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].revenue += item.subtotal;
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Kategori terlaris
    const categorySales = {};
    transactions.forEach((transaction) => {
      // Perbaikan: Mengubah 'items' menjadi 'transactionItems' sesuai dengan skema Prisma
      transaction.transactionItems.forEach((item) => {
        const category = item.product.category || "Uncategorized";
        if (!categorySales[category]) {
          categorySales[category] = { name: category, quantity: 0, revenue: 0 };
        }
        categorySales[category].quantity += item.quantity;
        categorySales[category].revenue += item.subtotal;
      });
    });
    const categoryData = Object.values(categorySales);

    // Audit log laporan
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "REPORT",
        description: `Generated sales report from ${format(
          start,
          "yyyy-MM-dd"
        )} to ${format(end, "yyyy-MM-dd")}`,
        tableName: "Report",
        recordId: 0,
        newData: JSON.stringify({
          startDate: start,
          endDate: end,
          totalSales,
          totalOrders,
        }),
      },
    });

    return NextResponse.json({
      summary: {
        totalSales,
        totalOrders,
        averageSale: totalOrders > 0 ? totalSales / totalOrders : 0,
        startDate: start,
        endDate: end,
      },
      salesData,
      topProducts,
      categoryData,
    });
  } catch (error) {
    console.error("Error generating sales report:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
