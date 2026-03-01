import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/cookie-consent";

export const metadata: Metadata = {
  title: "Acaller | AI Outbound Calling Platform",
  description: "Launch outbound call campaigns, connect live leads, and optimize conversion with AI caller identities.",
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="antialiased min-h-screen bg-background text-foreground flex flex-col">
        {children}
        <CookieConsent />
        <Toaster />
      </body>
    </html>
  );
}
