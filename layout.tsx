import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Who Runs This Frame?",
  description:
    "AI-powered frame dominance analysis. Upload a photo of 2–6 people and find out who commands the frame.",
  openGraph: {
    title: "Who Runs This Frame?",
    description: "AI-powered frame dominance analysis.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
