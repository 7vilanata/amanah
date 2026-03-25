"use client";

import { startTransition, useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  function handleLogout() {
    startTransition(async () => {
      setPending(true);
      await signOut({
        callbackUrl: "/login",
      });
      setPending(false);
    });
  }

  return (
    <Button variant="secondary" className="w-full justify-between" onClick={handleLogout} disabled={pending}>
      {pending ? "Keluar..." : "Keluar"}
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
