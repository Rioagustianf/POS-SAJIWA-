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
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";

export default function AppSidebar({ roles = [] }) {
  const pathname = usePathname();
  const router = useRouter();

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
      label: "Kelola Produk",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      href: "/admin/users",
      label: "Kelola Pengguna",
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
      label: "Kelola Produk",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      href: "/admin/users",
      label: "Kelola Pengguna",
      icon: <Users className="h-5 w-5" />,
    },
    {
      href: "/admin/sales-history",
      label: "Riwayat Penjualan",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      href: "/admin/audit-logs",
      label: "Log Aktivitas",
      icon: <AlertCircle className="h-5 w-5" />,
    },
    {
      href: "/admin/data-cleanup",
      label: "Hapus Data",
      icon: <Trash2 className="h-5 w-5" />,
    },
    {
      href: "/admin/print-reports",
      label: "Laporan Penjualan",
      icon: <Receipt className="h-5 w-5" />,
    },
  ];

  const cashierLinks = [
    {
      href: "/pos",
      label: "Transaksi Baru",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      href: "/pos/history",
      label: "Riwayat Penjualan",
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
    <Sidebar className="border-r border-[#4a102a]">
      <SidebarHeader className="bg-[#4a102a] p-4">
        <div className="flex items-center gap-2">
          <Utensils className="h-6 w-6 text-[#fcf259]" />
          <h1 className="text-xl font-bold text-white">Sajiwa Steak</h1>
          <span className="ml-auto bg-[#85193c] text-white text-xs px-2 py-1 rounded">
            {roles.join(", ")}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#fcf259]">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#4a102a] font-semibold">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.length > 0 ? (
                links.map((link) => (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={activeHref === link.href}
                      className={`${
                        activeHref === link.href
                          ? "bg-[#c5172e] text-white hover:bg-[#c5172e]/90"
                          : "text-[#4a102a] hover:bg-[#85193c]/20 hover:text-[#85193c]"
                      }`}
                    >
                      <Link href={link.href}>
                        {link.icon}
                        <span className="ml-3">{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <SidebarMenuItem>
                  <span className="text-center text-[#85193c] opacity-60 block p-2">
                    No menu items available
                  </span>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-[#fcf259] border-t border-[#4a102a]/20">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="text-[#4a102a] hover:bg-[#85193c]/20 hover:text-[#85193c]"
            >
              <button
                onClick={handleLogout}
                className="flex items-center w-full"
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-3">Logout</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
