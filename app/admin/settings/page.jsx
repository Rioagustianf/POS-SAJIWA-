"use client";

import { useState } from "react";
import {
  Save,
  User,
  Lock,
  Store,
  Phone,
  Mail,
  MapPin,
  Globe,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/admin-layout";

// Komponen utama untuk halaman pengaturan
export default function Settings() {
  // State untuk pengaturan umum restoran
  const [generalSettings, setGeneralSettings] = useState({
    restaurantName: "Sajiwa Steak Restaurant",
    phone: "+62 812 3456 7890",
    email: "info@sajiwasteak.com",
    address: "Jl. Gatot Subroto No. 123, Jakarta Selatan",
    website: "www.sajiwasteak.com",
    openingHours: "10:00 - 22:00",
    taxRate: "0",
    currency: "IDR",
  });

  // State untuk pengaturan password
  const [passwordSettings, setPasswordSettings] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // State untuk status loading
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi untuk menangani perubahan input pengaturan umum
  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings({
      ...generalSettings,
      [name]: value,
    });
  };

  // Fungsi untuk menangani perubahan input password
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordSettings({
      ...passwordSettings,
      [name]: value,
    });
  };

  // Fungsi untuk menyimpan pengaturan umum
  const saveGeneralSettings = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulasi panggilan API
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Pengaturan umum berhasil disimpan");
    }, 1000);
  };

  // Fungsi untuk mengganti password
  const changePassword = (e) => {
    e.preventDefault();

    // Validasi password baru
    if (passwordSettings.newPassword !== passwordSettings.confirmPassword) {
      toast.error("Password baru tidak cocok");
      return;
    }

    if (passwordSettings.newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setIsLoading(true);

    // Simulasi panggilan API
    setTimeout(() => {
      setIsLoading(false);
      setPasswordSettings({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password berhasil diganti");
    }, 1000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>

        {/* General Settings */}
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-semibold">General Settings</h2>
            <p className="text-muted-foreground text-sm">
              Manage your restaurant information
            </p>
          </div>

          <form onSubmit={saveGeneralSettings} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="restaurantName"
                  className="block text-sm font-medium mb-1"
                >
                  Restaurant Name
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    id="restaurantName"
                    name="restaurantName"
                    value={generalSettings.restaurantName}
                    onChange={handleGeneralChange}
                    className="pl-9 pr-4 py-2 border border-input rounded-md w-full bg-background"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium mb-1"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={generalSettings.phone}
                    onChange={handleGeneralChange}
                    className="pl-9 pr-4 py-2 border border-input rounded-md w-full bg-background"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={generalSettings.email}
                    onChange={handleGeneralChange}
                    className="pl-9 pr-4 py-2 border border-input rounded-md w-full bg-background"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="block text-sm font-medium mb-1"
                >
                  Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    id="website"
                    name="website"
                    value={generalSettings.website}
                    onChange={handleGeneralChange}
                    className="pl-9 pr-4 py-2 border border-input rounded-md w-full bg-background"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="openingHours"
                  className="block text-sm font-medium mb-1"
                >
                  Opening Hours
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    id="openingHours"
                    name="openingHours"
                    value={generalSettings.openingHours}
                    onChange={handleGeneralChange}
                    className="pl-9 pr-4 py-2 border border-input rounded-md w-full bg-background"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="taxRate"
                  className="block text-sm font-medium mb-1"
                >
                  Tax Rate
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="taxRate"
                    name="taxRate"
                    value={generalSettings.taxRate}
                    onChange={handleGeneralChange}
                    className="pl-9 pr-4 py-2 border border-input rounded-md w-full bg-background"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="currency"
                  className="block text-sm font-medium mb-1"
                >
                  Currency
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="currency"
                    name="currency"
                    value={generalSettings.currency}
                    onChange={handleGeneralChange}
                    className="pl-9 pr-4 py-2 border border-input rounded-md w-full bg-background"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
