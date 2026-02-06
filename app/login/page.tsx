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
  const [nisn, setNisn] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError("Email is required");
      return;
    }

    if (!nisn.trim()) {
      setLocalError("NISN is required");
      return;
    }

    try {
      await login(email, nisn);
      // Redirect after successful login
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-40 h-40 flex items-center justify-center shadow-md">
              <img
                src="logo.png"
                alt="Logo"
                className="w-full h-auto text-white"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">SIGMA</h1>
          <p className="text-muted-foreground">Biology Performence Tracker</p>
        </div>

        {/* Login Card */}
        <Card className="p-6 shadow-lg border-0">
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
                NISN
              </label>
              <Input
                type="text"
                placeholder="Your NISN"
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                disabled={isLoading}
                className="h-10"
              />
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
            Use your email address and NISN to access your academic dashboard.
          </p>
        </Card>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          SIGMA © 2026 - Biology Performance Tracker
        </p>
      </div>
    </div>
  );
}
