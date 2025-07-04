
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import BoidProfiler from "@/components/boidprofiler";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeToggle from "@/components/theme-toggle";
import Copyright from "@/components/copyright";
import NavigationTracker from "@/components/navigation-tracker";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "sami f.",
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
      <body className={`${deptnf.className} min-h-screen antialiased`}>
        <ThemeProvider>
          <NavigationTracker />
          <ThemeToggle />
          <main className="flex min-h-screen flex-col">
            <div className="flex-grow pb-16">
              {children}
            </div>
            <Copyright />
            <BoidProfiler />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
