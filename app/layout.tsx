import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth/auth-provider";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "IssuePilot — AI-Powered GitHub Issue Triage and Repository Intelligence",
  description:
    "Analyze public GitHub repositories, calculate health scores, identify stale backlogs, detect duplicate issues, and triage with AI assistance.",
  keywords: [
    "GitHub",
    "Issue Triage",
    "Repository Health",
    "Open Source",
    "Duplicate Detection",
    "Developer Tools",
  ],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen flex flex-col font-sans relative overflow-x-hidden w-full max-w-full">
        {/* Ambient background light gradients for glassmorphic refraction */}
        <div
          className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[650px] max-h-[650px] rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="absolute top-[25%] right-[-5%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] rounded-full bg-cyan-500/10 blur-[130px]" />
          <div className="absolute bottom-[-10%] left-[25%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-violet-500/10 blur-[140px]" />
        </div>

        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
