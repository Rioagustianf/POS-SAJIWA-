// Import komponen yang dibutuhkan
import { NextResponse } from "next/server"; // Untuk menangani response API

// Fungsi POST untuk handle logout
export async function POST() {
  // Siapkan response sukses
  const response = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );

  // Hapus cookie session dengan mengatur value kosong dan maxAge 0
  response.cookies.set({
    name: "session", // Nama cookie yang akan dihapus
    value: "", // Value dikosongkan
    httpOnly: true, // Hanya bisa diakses via HTTP
    path: "/", // Path cookie
    secure: process.env.NODE_ENV === "production", // HTTPS only di production
    maxAge: 0, // Expired langsung (hapus cookie)
  });

  // Kembalikan response
  return response;
}
