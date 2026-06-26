"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res.error) {
        toast.error("Invalid credentials. Please try again.");
      } else {
        toast.success("Logged in successfully!");
        router.push("/admin");
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--surface)] text-[var(--text)] rounded-2xl p-8 shadow-sm border border-[var(--border)]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 text-[var(--text)]">Admin Console</h1>
          <p className="text-[var(--text-muted)] text-sm">
            Sign in to manage Couponchy
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text)]">Email Address</label>
            <Input
              type="email"
              required
              placeholder="admin@couponchy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text)]">Password</label>
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full py-3 mt-4 flex items-center justify-center font-medium"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
