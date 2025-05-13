import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET: Ambil semua produk
export async function GET(request) {
  try {
    // Ambil semua produk, urutkan berdasarkan nama
    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Tambah produk baru
export async function POST(request) {
  try {
    // Ambil session user
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ambil data user dan role-nya
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { userRoles: { include: { role: true } } },
    });
    const roles = user.userRoles.map((ur) => ur.role.name);

    // Hanya Admin/Manajer yang boleh menambah produk
    if (!roles.includes("Admin") && !roles.includes("Manajer")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ambil data produk dari request
    const data = await request.json();
    if (!data.name || !data.price) {
      return NextResponse.json(
        { message: "Name and price are required" },
        { status: 400 }
      );
    }

    // Simpan produk baru ke database
    const product = await prisma.product.create({
      data: {
        name: data.name,
        price: parseInt(data.price),
        stock: data.stock ? parseInt(data.stock) : 0,
        description: data.description || null,
        category: data.category || null,
        image: data.image || null,
        createdById: session.id,
        updatedById: session.id,
      },
    });

    // Catat aktivitas ke audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "CREATE",
        description: `Created product: ${data.name}`,
        tableName: "Product",
        recordId: product.id,
        newData: JSON.stringify(product),
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
