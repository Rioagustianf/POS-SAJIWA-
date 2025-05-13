import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

// Membuat JWT, payload bisa berisi { id, username, roles }
export async function signJWT(payload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey);
  return token;
}

// Verifikasi JWT dan kembalikan payload
export async function verifyJWT(token) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    return null;
  }
}

// Mendapatkan session user dari cookies
export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifyJWT(token);
}

// Untuk proteksi API route (opsional)
export async function updateSession(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return session;
}
