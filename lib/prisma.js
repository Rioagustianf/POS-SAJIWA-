// Import PrismaClient dari package @prisma/client untuk koneksi database
import { PrismaClient } from "@prisma/client";

// PrismaClient dilekatkan ke objek `global` di development untuk mencegah
// habisnya batas koneksi database karena hot-reloading
const globalForPrisma = global;

// Membuat instance PrismaClient baru jika belum ada di global
// Menggunakan instance yang sudah ada jika sudah tersedia di global
const prisma = globalForPrisma.prisma || new PrismaClient();

// Menyimpan instance PrismaClient ke global object jika dalam mode development
// Hal ini mencegah pembuatan koneksi database baru setiap kali hot-reload
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Export instance PrismaClient untuk digunakan di file lain
export default prisma;
