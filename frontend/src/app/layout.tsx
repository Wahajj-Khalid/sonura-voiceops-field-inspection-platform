import type { Metadata } from "next";
import "./globals.css";
import { APP_CONFIG } from "../config/constants";
import { AuthProvider } from "../features/auth/auth-context";

export const metadata: Metadata = {
  title: APP_CONFIG.tabTitle,
  description: APP_CONFIG.tagline,
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#06080d] text-slate-100 antialiased min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}