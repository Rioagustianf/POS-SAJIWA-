import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET: Ambil detail produk berdasarkan ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });
    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update produk (hanya Admin/Manajer)
export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    // Cek role user
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { userRoles: { include: { role: true } } },
    });
    const roles = user.userRoles.map((ur) => ur.role.name);
    if (!roles.includes("Admin") && !roles.includes("Manajer")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const data = await request.json();
    if (!data.name || !data.price) {
      return NextResponse.json(
        { message: "Name and price are required" },
        { status: 400 }
      );
    }

    // Simpan data lama untuk audit log
    const oldProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    // Update produk
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        price: parseInt(data.price),
        stock: data.stock ? parseInt(data.stock) : 0,
        description: data.description || null,
        category: data.category || null,
        image: data.image || null,
        updatedById: session.id,
      },
    });

    // Catat ke audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "UPDATE",
        description: `Updated product: ${data.name}`,
        tableName: "Product",
        recordId: product.id,
        oldData: JSON.stringify(oldProduct),
        newData: JSON.stringify(product),
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus produk (hanya Manajer)
export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    // Cek role user
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { userRoles: { include: { role: true } } },
    });
    const roles = user.userRoles.map((ur) => ur.role.name);
    if (!roles.includes("Manajer")) {
      return NextResponse.json(
        { message: "Unauthorized - only Manager can delete products" },
        { status: 401 }
      );
    }

    const { id } = params;
    // Pastikan produk ada
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });
    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // Pastikan produk tidak dipakai di transaksi
    const transactionItems = await prisma.transactionItem.findMany({
      where: { productId: parseInt(id) },
    });
    if (transactionItems.length > 0) {
      return NextResponse.json(
        { message: "Cannot delete product that is used in transactions" },
        { status: 400 }
      );
    }

    // Catat ke audit log sebelum hapus
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "DELETE",
        description: `Deleted product: ${product.name}`,
        tableName: "Product",
        recordId: product.id,
        oldData: JSON.stringify(product),
      },
    });

    // Hapus produk
    await prisma.product.delete({ where: { id: parseInt(id) } });

    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
