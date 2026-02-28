import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Who Runs This Frame?",
  description: "AI-powered visual dominance analysis. Upload a photo of 2 people and find out who commands the frame.",
  openGraph: {
    title: "Who Runs This Frame?",
    description: "AI-powered visual dominance analysis.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
