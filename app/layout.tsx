import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen flex flex-col font-sans">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
