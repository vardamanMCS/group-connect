import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#1B4965",
};

export const metadata: Metadata = {
  title: "Group Connect - Maison Colin-Seguin",
  description:
    "Application pour les commissionnaires : g\u00e9rez vos contacts, envoyez vos campagnes et suivez vos commissions avec Group Connect.",
  icons: { icon: "/favicon.svg", apple: "/icons/icon.svg" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Group Connect",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${inter.variable} font-sans antialiased bg-warm-bg text-gray-900`}
      >
        {children}
      </body>
    </html>
  );
}
