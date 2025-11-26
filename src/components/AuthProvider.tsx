"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');

  return (
    <SessionProvider>
      {children}
      {!isAuthPage && <Footer />}
    </SessionProvider>
  );
}
