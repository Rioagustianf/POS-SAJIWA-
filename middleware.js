import { NextResponse } from "next/server";
import { verifyJWT } from "./lib/auth";

export async function middleware(request) {
  const path = request.nextUrl.pathname;

  // Public paths yang tidak perlu autentikasi
  const publicPaths = ["/login", "/api/auth/login"];
  const isPublicPath = publicPaths.some(
    (publicPath) => path === publicPath || path === publicPath + "/"
  );

  // Ambil token session dari cookies
  const token = request.cookies.get("session")?.value;

  // Jika public path
  if (isPublicPath) {
    // Jika sudah login dan akses /login, redirect ke dashboard sesuai role
    if (token && path === "/login") {
      try {
        const payload = await verifyJWT(token);
        if (payload && Array.isArray(payload.roles)) {
          if (payload.roles.includes("Manajer")) {
            return NextResponse.redirect(
              new URL("/admin/dashboard", request.url)
            );
          } else if (payload.roles.includes("Admin")) {
            return NextResponse.redirect(
              new URL("/admin/dashboard", request.url)
            );
          } else if (payload.roles.includes("Kasir")) {
            return NextResponse.redirect(new URL("/pos", request.url));
          }
        }
      } catch (error) {
        // Jika token invalid, lanjut ke halaman login
      }
    }
    // Jika belum login, atau bukan /login, lanjutkan
    return NextResponse.next();
  }

  // Jika bukan public path, cek token
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Verifikasi token
    const payload = await verifyJWT(token);
    if (!payload || !Array.isArray(payload.roles)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // RBAC: proteksi akses path berdasarkan role
    // Admin dan Manager menggunakan path /admin/...
    // Kasir menggunakan path /pos/...

    // Proteksi halaman Manager-specific di path /admin/...
    const managerOnlyPaths = [
      "/admin/inventory",
      "/admin/analytics",
      "/admin/settings",
    ];
    if (
      managerOnlyPaths.some((managerPath) => path.startsWith(managerPath)) &&
      !payload.roles.includes("Manajer")
    ) {
      // Redirect sesuai role
      if (payload.roles.includes("Admin")) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else if (payload.roles.includes("Kasir")) {
        return NextResponse.redirect(new URL("/pos", request.url));
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Proteksi halaman POS di path /pos/...
    if (path.startsWith("/pos") && !payload.roles.includes("Kasir")) {
      // Hanya kasir boleh akses /pos
      if (payload.roles.includes("Manajer")) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else if (payload.roles.includes("Admin")) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Proteksi halaman Admin di path /admin/...
    if (
      path.startsWith("/admin") &&
      !payload.roles.some((role) => ["Admin", "Manajer"].includes(role))
    ) {
      // Redirect kasir ke POS
      if (payload.roles.includes("Kasir")) {
        return NextResponse.redirect(new URL("/pos", request.url));
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Proteksi path lama /manager untuk backward compatibility
    if (path.startsWith("/manager")) {
      return NextResponse.redirect(
        new URL(path.replace("/manager", "/admin"), request.url)
      );
    }

    // Jika lolos semua, lanjutkan
    return NextResponse.next();
  } catch (error) {
    // Jika token tidak valid, redirect ke login
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// Konfigurasi matcher agar middleware hanya jalan di route yang diinginkan
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
