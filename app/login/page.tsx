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
      className="min-h-screen bg-[#06370b] flex items-center justify-center p-4"
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

      <div className="w-full max-w-md">
        {/* Header - Outside the card, above logo */}
        <div className="text-center mb-6">
          <h1 className="text-6xl font-bold text-white mb-1">SIGMA</h1>
          <p className="text-2xl text-white">
            Sistem Informasi Golden Star dan Monitoring Akademik
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-6 shadow-lg border-0 bg-white/70">
          {/* Logo inside the login box */}
          <div className="flex items-center justify-center mb-6">
            <img
              src="/logo_sekolah.png"
              alt="Logo Sekolah"
              className="w-24 h-auto"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="your.email@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-10"
              />
            </div>

            {/* NISN Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                type="password"
                placeholder="Your Password"
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                disabled={isLoading}
                className="h-10"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="rememberMe" className="text-sm text-foreground">
                Remember username and password
              </label>
            </div>

            {/* Error Message */}
            {(error || localError) && (
              <Alert variant="destructive">
                <AlertDescription>{error || localError}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Info Text */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            Use your email address and password to access your academic
            dashboard.
          </p>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <img src="/logo.png" alt="Logo" className="w-64 h-auto mx-auto" />
          <p className="text-2xl text-yellow-400 italic mt-2">
            Pantau Prestasi, Bangun Motivasi
          </p>
        </div>
      </div>
    </div>
  );
}
