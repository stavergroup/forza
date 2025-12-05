import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthContext";
import AppFrame from "@/components/AppFrame";

export const metadata: Metadata = {
  title: "FORZA",
  description: "Football · Predictions · Social",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0A0A0A] text-white">
        <AuthProvider>
          <AppFrame>{children}</AppFrame>
        </AuthProvider>
      </body>
    </html>
  );
}