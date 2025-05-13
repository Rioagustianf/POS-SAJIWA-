"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Utensils,
  FileText,
  AlertCircle,
  Trash2,
  Lock,
  UserCog,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

export default function Sidebar({ roles = [] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error(error.message || "Logout failed");
    }
  };

  // Define all possible links by role
  const adminLinks = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: "/admin/products",
      label: "Mengelola Produk",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      href: "/admin/users",
      label: "Mengelola Pengguna",
      icon: <Users className="h-5 w-5" />,
    },
    {
      href: "/admin/reports",
      label: "Laporan Penjualan",
      icon: <FileText className="h-5 w-5" />,
    },
  ];

  const managerLinks = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: "/admin/products",
      label: "Mengelola Produk",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      href: "/admin/users",
      label: "Mengelola Pengguna",
      icon: <Users className="h-5 w-5" />,
    },
    {
      href: "/admin/sales-history",
      label: "Riwayat Penjualan",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      href: "/admin/audit-logs",
      label: "Melihat Audit Log",
      icon: <AlertCircle className="h-5 w-5" />,
    },
    {
      href: "/admin/data-cleanup",
      label: "Menghapus Data Penting",
      icon: <Trash2 className="h-5 w-5" />,
    },
    {
      href: "/admin/print-reports",
      label: "Mencetak Laporan",
      icon: <Receipt className="h-5 w-5" />,
    },
  ];

  const cashierLinks = [
    {
      href: "/pos",
      label: "Melakukan Transaksi",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      href: "/pos/history",
      label: "Melihat Riwayat Penjualan",
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ];

  // Determine which links to show based on roles
  let links = [];
  if (roles.includes("Manajer")) {
    links = managerLinks;
  } else if (roles.includes("Admin")) {
    links = adminLinks;
  } else if (roles.includes("Kasir")) {
    links = cashierLinks;
  }

  links = links.filter((link) => !link.role || roles.includes(link.role));

  function getActiveHref(pathname, links) {
    const matched = links
      .map((link) => link.href)
      .filter(
        (href) =>
          pathname === href || (href !== "/" && pathname.startsWith(href + "/"))
      );
    if (matched.length === 0) return null;
    return matched.reduce((a, b) => (a.length > b.length ? a : b));
  }

  const activeHref = getActiveHref(pathname, links);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-[#c5172e] text-white"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } bg-[#fcf259] border-r border-[#4a102a] w-64 lg:w-72`}
      >
        <div className="flex flex-col h-full">
          <div
            className="flex items-center gap-2 px-6 py-4"
            style={{ background: "#4a102a" }}
          >
            <Utensils className="h-6 w-6 text-[#fcf259]" />
            <h1 className="text-xl font-bold text-white">Sajiwa Steak</h1>
            <span className="ml-auto bg-[#85193c] text-white text-xs px-2 py-1 rounded">
              {roles.join(", ")}
            </span>
          </div>

          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {links.length > 0 ? (
                links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`flex items-center px-3 py-2 rounded-md transition-colors font-medium
                        ${
                          activeHref === link.href
                            ? "bg-[#c5172e] text-white"
                            : "text-[#4a102a] hover:bg-[#85193c]/20 hover:text-[#85193c]"
                        }
                      `}
                    >
                      {link.icon}
                      <span className="ml-3">{link.label}</span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-center text-[#85193c] opacity-60">
                  No menu items available
                </li>
              )}
            </ul>
          </nav>

          <div className="p-4 border-t border-[#4a102a]">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-[#85193c]/20 text-[#85193c] transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
