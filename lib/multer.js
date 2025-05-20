// Import library multer untuk menangani upload file
import multer from "multer";
// Import library path untuk mengelola path file dan direktori
import path from "path";
// Import library fs (file system) untuk operasi file
import fs from "fs";

// Mendefinisikan direktori untuk menyimpan file upload
const uploadDir = path.join(process.cwd(), "public/uploads");
// Mengecek apakah direktori uploads sudah ada
if (!fs.existsSync(uploadDir)) {
  // Jika belum ada, buat direktori baru secara rekursif
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan file upload
const storage = multer.diskStorage({
  // Menentukan lokasi penyimpanan file
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  // Menentukan nama file yang akan disimpan
  filename: function (req, file, cb) {
    // Membuat nama unik dengan timestamp dan angka random
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Mendapatkan ekstensi dari file original
    const ext = path.extname(file.originalname);
    // Menggabungkan nama field, suffix unik, dan ekstensi
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Filter untuk memvalidasi tipe file
const fileFilter = (req, file, cb) => {
  // Memeriksa ekstensi file menggunakan regex
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    // Jika bukan file gambar, tolak dengan error
    return cb(new Error("Only image files are allowed!"), false);
  }
  // Jika file gambar, terima file
  cb(null, true);
};

// Membuat instance multer dengan konfigurasi
const upload = multer({
  storage: storage, // Menggunakan storage yang sudah dikonfigurasi
  limits: {
    fileSize: 5 * 1024 * 1024, // Membatasi ukuran file maksimal 5MB
  },
  fileFilter: fileFilter, // Menggunakan filter file yang sudah dibuat
});

// Export instance multer untuk digunakan di file lain
export default upload;
