"use client";

import React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Leaf, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [nis, setNis] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Load saved credentials on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("rememberedEmail");
      const savedNis = localStorage.getItem("rememberedNis");
      if (savedEmail) setEmail(savedEmail);
      if (savedNis) setNis(savedNis);
      if (savedEmail || savedNis) setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError("Email is required");
      return;
    }

    if (!nis.trim()) {
      setLocalError("Password is required");
      return;
    }

    // Save credentials if remember me is checked
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
      localStorage.setItem("rememberedNis", nis);
    } else {
      localStorage.removeItem("rememberedEmail");
      localStorage.removeItem("rememberedNis");
    }

    try {
      await login(email, nis);
      // Redirect after successful login
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div
      className="min-h-screen bg-[#06370b] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden"
      style={{
        backgroundColor: "#06370b",
      }}
    >
      {/* Force light mode styles */}
      <style jsx global>{`
        :root {
          --background: #ffffff !important;
          --foreground: #000000 !important;
          --card: #ffffff !important;
          --card-foreground: #000000 !important;
          --popover: #ffffff !important;
          --popover-foreground: #000000 !important;
          --primary: #06370b !important;
          --primary-foreground: #ffffff !important;
          --secondary: #f3f4f6 !important;
          --secondary-foreground: #000000 !important;
          --muted: #f3f4f6 !important;
          --muted-foreground: #000000 !important;
          --accent: #f3f4f6 !important;
          --accent-foreground: #000000 !important;
          --destructive: #ef4444 !important;
          --destructive-foreground: #ffffff !important;
          --border: #e5e7eb !important;
          --input: #e5e7eb !important;
          --ring: #06370b !important;
        }
        .dark {
          --background: #ffffff !important;
          --foreground: #000000 !important;
          --card: #ffffff !important;
          --card-foreground: #000000 !important;
          --popover: #ffffff !important;
          --popover-foreground: #000000 !important;
          --primary: #06370b !important;
          --primary-foreground: #ffffff !important;
          --secondary: #f3f4f6 !important;
          --secondary-foreground: #000000 !important;
          --muted: #f3f4f6 !important;
          --muted-foreground: #000000 !important;
          --accent: #f3f4f6 !important;
          --accent-foreground: #000000 !important;
          --destructive: #ef4444 !important;
          --destructive-foreground: #ffffff !important;
          --border: #e5e7eb !important;
          --input: #e5e7eb !important;
          --ring: #06370b !important;
        }
      `}</style>

      <div className="w-full max-w-md max-h-screen overflow-hidden flex flex-col">
        {/* Header - Outside the card, above logo */}
        <div className="text-center mb-2 sm:mb-3">
          <h1 className="text-clamp-2xl sm:text-clamp-3xl font-bold text-white mb-0.5 sm:mb-1">
            SIGMA
          </h1>
          <p className="text-xs text-white leading-tight">
            Sistem Informasi Golden Star dan Monitoring Akademik
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-3 sm:p-4 shadow-lg border-0 bg-white/70 flex-shrink-0">
          {/* Logo inside the login box */}
          <div className="flex items-center justify-center mb-2 sm:mb-3">
            <img
              src="/logo_sekolah.png"
              alt="Logo Sekolah"
              className="w-14 h-auto sm:w-16 md:w-20"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="your.email@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-9 sm:h-10"
              />
            </div>

            {/* NISN Input */}
            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                type="password"
                placeholder="Your Password"
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                disabled={isLoading}
                className="h-9 sm:h-10"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3 h-3 mr-2"
              />
              <label htmlFor="rememberMe" className="text-xs text-foreground">
                Remember username and password
              </label>
            </div>

            {/* Error Message */}
            {(error || localError) && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription className="text-xs">
                  {error || localError}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 sm:h-10 bg-primary hover:bg-primary/90 text-white font-medium text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Info Text */}
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Use your email address and password to access your academic
            dashboard.
          </p>
        </Card>

        {/* Footer */}
        <div className="text-center mt-2 sm:mt-3 flex-shrink-0">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-32 h-auto sm:w-40 md:w-48 mx-auto"
          />
          <p className="text-xs text-yellow-400 italic mt-1">
            Pantau Prestasi, Bangun Motivasi
          </p>
        </div>
      </div>
    </div>
  );
}
