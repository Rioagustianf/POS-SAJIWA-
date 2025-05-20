// Import komponen yang diperlukan
import { NextResponse } from "next/server"; // Untuk menangani response API
import { getSession } from "@/lib/auth"; // Untuk mengecek session/login user
import upload from "@/lib/multer"; // Untuk menangani upload file
import { writeFile } from "fs/promises"; // Untuk menulis file ke sistem
import path from "path"; // Untuk menangani path file
import { v4 as uuidv4 } from "uuid"; // Untuk generate nama file unik

// Fungsi POST untuk upload file/gambar
export async function POST(request) {
  try {
    // Cek apakah user sudah login dengan mengambil session
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Cek role user dengan mengambil data user dan relasinya
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { userRoles: { include: { role: true } } }, // Include relasi role
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    const roles = user.userRoles.map((ur) => ur.role.name); // Ambil daftar role

    // Validasi role: hanya Admin/Manajer yang boleh upload
    if (!roles.includes("Admin") && !roles.includes("Manajer")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ambil file dari form data request
    const formData = await request.formData();
    const file = formData.get("file");

    // Validasi keberadaan file
    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validasi tipe file yang diperbolehkan
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Invalid file type. Only JPEG, PNG, and GIF are allowed." },
        { status: 400 }
      );
    }

    // Validasi ukuran file (maksimal 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Konversi file ke buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Buat nama file unik dengan UUID
    const fileName = `${uuidv4()}${path.extname(file.name)}`;
    const uploadDir = path.join(process.cwd(), "public/uploads"); // Set direktori upload
    const filePath = path.join(uploadDir, fileName); // Path lengkap file

    // Simpan file ke sistem
    await writeFile(filePath, buffer);

    // Buat URL untuk akses file
    const fileUrl = `/uploads/${fileName}`;

    // Kembalikan URL file yang telah diupload
    return NextResponse.json({ url: fileUrl }, { status: 200 });
  } catch (error) {
    console.error("Error uploading file:", error); // Log error ke console
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
