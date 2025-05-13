"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Utensils, User, Lock } from "lucide-react";
import { toast } from "sonner";
import bgLogin from "../../public/bglogin.jpg";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "";
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
      toast.success("Login successful!");

      const roles = data.user.roles || [];
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
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#4a102a" }}>
      {/* Gambar kiri */}
      <div className="hidden md:block md:w-1/2 relative">
        <Image
          src={bgLogin}
          alt="Sajiwa Restaurant"
          fill
          className="object-cover h-full w-full"
          priority
        />
      </div>
      {/* Form kanan */}
      <div
        className="flex w-full md:w-1/2 items-center justify-center"
        style={{ background: "#4a102a" }}
      >
        <div
          className="w-full max-w-md p-8 space-y-8 rounded-lg shadow-lg"
          style={{ background: "#85193c" }}
        >
          <div className="text-center">
            <Utensils
              className="mx-auto h-12 w-12"
              style={{ color: "#fcf259" }}
            />
            <h2
              className="mt-6 text-3xl font-bold"
              style={{ color: "#fcf259" }}
            >
              Sajiwa Steak Restaurant
            </h2>
            <p className="mt-2" style={{ color: "#fcf259", opacity: 0.85 }}>
              {role === "admin"
                ? "Admin Login"
                : role === "cashier"
                ? "Cashier Login"
                : "Login to your account"}
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium"
                  style={{ color: "#fcf259" }}
                >
                  Username
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5" style={{ color: "#fcf259" }} />
                  </div>
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
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium"
                  style={{ color: "#fcf259" }}
                >
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5" style={{ color: "#fcf259" }} />
                  </div>
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
            <div>
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
                {isLoading ? "Logging in..." : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
