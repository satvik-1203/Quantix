import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import Header from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarReopenButton } from "@/components/sidebar-reopen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quantix · Synthetic Data, Grounded in Truth",
  description: "Quantix · Synthetic Data, Grounded in Truth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <div className="grid grid-rows-[auto_1fr] h-svh">
                {/* <Header /> */}
                {children}
              </div>
              <SidebarReopenButton />
            </SidebarInset>
          </SidebarProvider>
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  );
}
