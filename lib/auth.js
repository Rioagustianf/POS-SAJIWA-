// Import library jose untuk menangani JWT (JSON Web Token)
import { SignJWT, jwtVerify } from "jose";
// Import cookies dari next/headers untuk mengelola cookie
import { cookies } from "next/headers";
// Import NextResponse untuk menangani response dari Next.js
import { NextResponse } from "next/server";

// Membuat secret key untuk JWT dengan mengenkode environment variable JWT_SECRET
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

// Fungsi untuk membuat JWT baru dengan payload yang diberikan
export async function signJWT(payload) {
  // Membuat token JWT baru dengan SignJWT
  const token = await new SignJWT(payload)
    // Set algoritma enkripsi HS256
    .setProtectedHeader({ alg: "HS256" })
    // Set waktu pembuatan token
    .setIssuedAt()
    // Set masa berlaku token selama 24 jam
    .setExpirationTime("24h")
    // Tanda tangani token dengan secret key
    .sign(secretKey);
  return token;
}

// Fungsi untuk memverifikasi JWT dan mengembalikan payload
export async function verifyJWT(token) {
  try {
    // Verifikasi token menggunakan secret key
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    // Jika verifikasi gagal, kembalikan null
    return null;
  }
}

// Fungsi untuk mendapatkan session user dari cookies
export async function getSession() {
  // Ambil cookie store dari request
  const cookieStore = cookies();
  // Ambil nilai token dari cookie 'session'
  const token = cookieStore.get("session")?.value;
  // Jika tidak ada token, kembalikan null
  if (!token) return null;
  // Verifikasi token dan kembalikan payload
  return verifyJWT(token);
}

// Fungsi middleware untuk memproteksi route API
export async function updateSession(request) {
  // Cek session yang aktif
  const session = await getSession();
  // Jika tidak ada session, redirect ke halaman login
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  // Jika ada session, kembalikan data session
  return session;
}
