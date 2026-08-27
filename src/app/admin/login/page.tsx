"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      password: form.get("password"),
      redirect: false,
    });

    if (result?.error) {
      toast.error("Invalid password");
      setLoading(false);
    } else {
      router.push("/admin");
    }
  }

  return (
    <div className="grain-overlay flex-1 flex items-center justify-center bg-gradient-to-br from-warm-50 via-background to-warm-100">
      <div className="w-full max-w-sm mx-auto px-6">
        <div className="animate-fade-in-up rounded-2xl border border-border bg-card p-8 shadow-lg shadow-black/5">
          <div className="flex flex-col items-center gap-3 mb-8">
            <Image src="/logo.png" alt="MamathaRaj Photography" width={48} height={48} />
            <span className="text-lg font-semibold">MamathaRaj Photography</span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter admin password"
                required
                className="h-11 rounded-xl"
              />
            </div>
            <Button type="submit" className="w-full h-11 rounded-xl" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
