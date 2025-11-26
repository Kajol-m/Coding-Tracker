import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "sonner";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Coding Tracker",
  description: "Generated with love by Kajol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pressStart2P.className} antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster richColors position="top-center" />
        </ErrorBoundary>
      </body>
    </html>
  );
}
