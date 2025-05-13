import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Extract roles
    const roles = user.userRoles.map((ur) => ur.role.name);

    // Kembalikan format respons ke format aslinya yang diharapkan oleh AdminLayout
    return NextResponse.json(
      {
        user: {
          id: user.id,
          username: user.username,
          roles: roles,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
