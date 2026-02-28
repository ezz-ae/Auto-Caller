import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/cookie-consent";

export const metadata: Metadata = {
  title: "Acaller | AI Outbound Calling Platform",
  description: "Launch outbound call campaigns, connect live leads, and optimize conversion with AI caller identities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
        <CookieConsent />
        <Toaster />
      </body>
    </html>
  );
}
