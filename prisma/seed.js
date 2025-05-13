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

  // Hash password
  const hashedManagerPassword = await bcrypt.hash("manager123", 10);
  const hashedAdminPassword = await bcrypt.hash("admin123", 10);
  const hashedCashierPassword = await bcrypt.hash("cashier123", 10);

  // Buat user Manajer
  const manager = await prisma.user.upsert({
    where: { username: "manager" },
    update: {},
    create: {
      username: "manager",
      password: hashedManagerPassword,
    },
  });

  // Buat user Admin
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedAdminPassword,
    },
  });

  // Buat user Kasir
  const cashier = await prisma.user.upsert({
    where: { username: "cashier" },
    update: {},
    create: {
      username: "cashier",
      password: hashedCashierPassword,
    },
  });

  // Ambil role id
  const roleManajer = await prisma.role.findUnique({
    where: { name: "Manajer" },
  });
  const roleAdmin = await prisma.role.findUnique({ where: { name: "Admin" } });
  const roleKasir = await prisma.role.findUnique({ where: { name: "Kasir" } });

  // Hubungkan user ke role masing-masing (UserRole)
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: manager.id, roleId: roleManajer.id } },
    update: {},
    create: { userId: manager.id, roleId: roleManajer.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: roleAdmin.id } },
    update: {},
    create: { userId: admin.id, roleId: roleAdmin.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: cashier.id, roleId: roleKasir.id } },
    update: {},
    create: { userId: cashier.id, roleId: roleKasir.id },
  });

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
