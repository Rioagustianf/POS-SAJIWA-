// Menandai bahwa komponen ini berjalan di sisi klien
"use client";

// Mengimpor hook useState untuk manajemen state lokal
import { useState } from "react";
// Mengimpor hook router dan searchParams untuk navigasi dan query parameter
import { useRouter, useSearchParams } from "next/navigation";
// Mengimpor komponen Image untuk optimasi gambar
import Image from "next/image";
// Mengimpor ikon-ikon yang dibutuhkan dari Lucide
import { Utensils, User, Lock } from "lucide-react";
// Mengimpor komponen toast untuk notifikasi
import { toast } from "sonner";
// Mengimpor gambar background login
import bgLogin from "../../public/bglogin.jpg";

// Mendefinisikan komponen Login
export default function Login() {
  // Menginisialisasi router untuk navigasi
  const router = useRouter();
  // Mendapatkan parameter query dari URL
  const searchParams = useSearchParams();
  // Mengambil parameter role dari URL, jika tidak ada gunakan string kosong
  const role = searchParams.get("role") || "";
  // Membuat state untuk menyimpan data form login
  const [formData, setFormData] = useState({ username: "", password: "" });
  // Membuat state untuk menandai proses loading
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi untuk menangani perubahan input form
  const handleChange = (e) => {
    // Mengekstrak name dan value dari event target
    const { name, value } = e.target;
    // Memperbarui state formData dengan nilai baru
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Fungsi untuk menangani submit form
  const handleSubmit = async (e) => {
    // Mencegah perilaku default form submit
    e.preventDefault();
    // Mengaktifkan state loading
    setIsLoading(true);
    try {
      // Mengirim request POST ke endpoint login
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      // Mengubah response menjadi JSON
      const data = await response.json();
      // Mengecek apakah response berhasil
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
      // Menampilkan notifikasi sukses
      toast.success("Login successful!");

      // Mendapatkan array roles dari data user
      const roles = data.user.roles || [];
      // Mengarahkan user ke halaman yang sesuai berdasarkan role
      if (roles.includes("Manajer")) {
        router.push("/admin/dashboard");
      } else if (roles.includes("Admin")) {
        router.push("/admin/dashboard");
      } else if (roles.includes("Kasir")) {
        router.push("/pos");
      } else {
        router.push("/");
      }
    } catch (error) {
      // Menampilkan notifikasi error jika terjadi kesalahan
      toast.error(error.message || "Login failed");
    } finally {
      // Menonaktifkan state loading setelah proses selesai
      setIsLoading(false);
    }
  };

  // Merender komponen
  return (
    // Container utama dengan background merah tua
    <div className="min-h-screen flex" style={{ background: "#4a102a" }}>
      {/* Container untuk gambar background, hanya tampil di layar medium ke atas */}
      <div className="hidden md:block md:w-1/2 relative">
        {/* Komponen Image untuk menampilkan gambar background */}
        <Image
          src={bgLogin}
          alt="Sajiwa Restaurant"
          fill
          className="object-cover h-full w-full"
          priority
        />
      </div>
      {/* Container untuk form login */}
      <div
        className="flex w-full md:w-1/2 items-center justify-center"
        style={{ background: "#4a102a" }}
      >
        {/* Card form login dengan background merah */}
        <div
          className="w-full max-w-md p-8 space-y-8 rounded-lg shadow-lg"
          style={{ background: "#85193c" }}
        >
          {/* Header form dengan logo dan judul */}
          <div className="text-center">
            {/* Ikon utensils sebagai logo */}
            <Utensils
              className="mx-auto h-12 w-12"
              style={{ color: "#fcf259" }}
            />
            {/* Judul aplikasi */}
            <h2
              className="mt-6 text-3xl font-bold"
              style={{ color: "#fcf259" }}
            >
              Sajiwa Steak Restaurant
            </h2>
            {/* Subtitle yang berubah sesuai role */}
            <p className="mt-2" style={{ color: "#fcf259", opacity: 0.85 }}>
              {role === "admin"
                ? "Admin Login"
                : role === "cashier"
                ? "Cashier Login"
                : "Login to your account"}
            </p>
          </div>

          {/* Form login dengan handler submit */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Container input username */}
              <div>
                {/* Label untuk input username */}
                <label
                  htmlFor="username"
                  className="block text-sm font-medium"
                  style={{ color: "#fcf259" }}
                >
                  Username
                </label>
                {/* Wrapper untuk input dan ikon */}
                <div className="mt-1 relative">
                  {/* Container untuk ikon user */}
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5" style={{ color: "#fcf259" }} />
                  </div>
                  {/* Input field untuk username */}
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-[#fcf259] focus:border-[#fcf259] bg-[#fffde4] text-[#4a102a] placeholder-[#c5172e]"
                    style={{
                      borderColor: "#c5172e",
                      background: "#fffde4",
                      color: "#4a102a",
                    }}
                    placeholder="Username"
                  />
                </div>
              </div>

              {/* Container input password */}
              <div>
                {/* Label untuk input password */}
                <label
                  htmlFor="password"
                  className="block text-sm font-medium"
                  style={{ color: "#fcf259" }}
                >
                  Password
                </label>
                {/* Wrapper untuk input dan ikon */}
                <div className="mt-1 relative">
                  {/* Container untuk ikon lock */}
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5" style={{ color: "#fcf259" }} />
                  </div>
                  {/* Input field untuk password */}
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-[#fcf259] focus:border-[#fcf259] bg-[#fffde4] text-[#4a102a] placeholder-[#c5172e]"
                    style={{
                      borderColor: "#c5172e",
                      background: "#fffde4",
                      color: "#4a102a",
                    }}
                    placeholder="Password"
                  />
                </div>
              </div>
            </div>

            {/* Container tombol submit */}
            <div>
              {/* Tombol submit dengan efek hover */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold transition-colors duration-200"
                style={{
                  background: "#fcf259",
                  color: "#4a102a",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#c5172e";
                  e.currentTarget.style.color = "#fffde4";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#fcf259";
                  e.currentTarget.style.color = "#4a102a";
                }}
              >
                {/* Text tombol yang berubah saat loading */}
                {isLoading ? "Logging in..." : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
