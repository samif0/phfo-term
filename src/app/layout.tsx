
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Boids from "@/components/boids";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Sami F",
  description: "Personal website of Sami F",
  icons: {
    icon: "/favicon.ico",
  },
};



const deptnf = localFont({ src: "../../public/DepartureMonoNerdFontMono-Regular.otf" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${deptnf.className} min-h-screen bg-black text-white antialiased`}>
        <main className="flex min-h-screen flex-col">
          <Boids />

          {children}
        </main>
      </body>
    </html>
  );
}
