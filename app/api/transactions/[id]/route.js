import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET a single transaction by ID
export async function GET(request, { params }) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const transaction = await prisma.transaction.findUnique({
      where: { id: Number.parseInt(id) },
      include: {
        user: {
          select: {
            username: true,
          },
        },
        transactionItems: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to view this transaction
    const userRoles =
      (
        await prisma.user.findUnique({
          where: { id: session.id },
          include: { userRoles: { include: { role: true } } },
        })
      )?.userRoles.map((ur) => ur.role.name) || [];
    const isAdmin = userRoles.includes("Admin");
    const isManager = userRoles.includes("Manajer");

    if (!isAdmin && !isManager && transaction.userId !== session.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE a transaction (admin only)
export async function DELETE(request, { params }) {
  try {
    const session = await getSession();

    const userRoles =
      (
        await prisma.user.findUnique({
          where: { id: session?.id },
          include: { userRoles: { include: { role: true } } },
        })
      )?.userRoles.map((ur) => ur.role.name) || [];
    const isAdmin = userRoles.includes("Admin");

    if (!session || !isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Check if transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { id: Number.parseInt(id) },
      include: {
        transactionItems: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 404 }
      );
    }

    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (prisma) => {
      // Restore product stock for each item
      for (const item of transaction.transactionItems) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (product) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: product.stock + item.quantity },
          });
        }
      }

      // Delete transaction items
      await prisma.transactionItem.deleteMany({
        where: { transactionId: Number.parseInt(id) },
      });

      // Delete transaction
      await prisma.transaction.delete({
        where: { id: Number.parseInt(id) },
      });
    });

    return NextResponse.json(
      { message: "Transaction deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
