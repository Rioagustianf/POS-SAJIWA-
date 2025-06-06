import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Buat role jika belum ada
  const rolesData = [{ name: "Manajer" }, { name: "Admin" }, { name: "Kasir" }];

  for (const role of rolesData) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: { name: role.name },
    });
  }

  // Hash password untuk manajer
  const hashedManagerPassword = await bcrypt.hash("manager123", 10);

  // Ambil role manajer
  const roleManajer = await prisma.role.findUnique({
    where: { name: "Manajer" },
  });

  // Cek apakah user manager sudah ada
  const existingManager = await prisma.user.findFirst({
    where: { username: "manager" },
  });

  // Buat user Manajer jika belum ada
  if (!existingManager) {
    await prisma.user.create({
      data: {
        username: "manager",
        password: hashedManagerPassword,
        roleId: roleManajer.id,
      },
    });
    console.log("✅ User manager berhasil dibuat!");
  } else {
    console.log("ℹ️ User manager sudah ada, skip pembuatan.");
  }

  console.log("✅ Seeder berhasil dijalankan!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
