import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "CyberGuardiansSociety — Attendance & Session Management Platform",
    template: "%s | CyberGuardiansSociety",
  },
  description:
    "Production SaaS attendance platform, registration synchronization, and Google Meet session management for CyberGuardiansSociety.",
  keywords: ["CyberGuardiansSociety", "CGS", "Attendance", "Cybersecurity", "Sessions"],
  icons: {
    icon: "/cgs-logo.png",
    shortcut: "/cgs-logo.png",
    apple: "/cgs-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased dark`}
    >
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
        <Toaster position="top-right" theme="dark" richColors />
      </body>
    </html>
  );
}
