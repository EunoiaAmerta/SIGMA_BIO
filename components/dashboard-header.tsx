"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Leaf, LogOut, RotateCw } from "lucide-react";
import { UserSession } from "@/lib/types";

interface DashboardHeaderProps {
  user: UserSession;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  currentSemester: string; // Tambahkan ini
  displayClass?: string; // Tambahkan ini
}

export function DashboardHeader({
  user,
  onRefresh,
  isRefreshing = false,
  currentSemester, // Ambil dari props
  displayClass, // Ambil dari props
}: DashboardHeaderProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };
  console.log("Data User di Header:", user);
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center shadow-md">
              <img
                src="logo.png"
                alt="Logo"
                className="w-full h-auto text-white"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                SIGMA
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {/* Prioritaskan displayClass, jika kosong baru tampilkan teks default */}
                {displayClass || "Memuat Kelas..."} - {currentSemester}
              </p>
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* User Info Card - Hidden on very small screens */}
            <Card className="hidden md:flex items-center gap-3 px-4 py-2 bg-accent/20 border-accent">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {user.email}
                </p>
              </div>
            </Card>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-1 sm:gap-2 bg-transparent px-2 sm:px-3"
            >
              <RotateCw
                className={`w-3 h-3 sm:w-4 sm:h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Sync Data</span>
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-1 sm:gap-2 bg-transparent px-2 sm:px-3"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
