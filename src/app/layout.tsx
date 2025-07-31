
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import BoidProfiler from "@/components/boidprofiler";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeToggle from "@/components/theme-toggle";
import InfiniteScroll from "@/components/infinite-scroll";
import Copyright from "@/components/copyright";
import NavigationTracker from "@/components/navigation-tracker";
import { isAdmin } from "@/lib/auth";
import Button from "@/components/btn";

export const viewport: Viewport = {
  themeColor: "#f4f1ed",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const admin = await isAdmin();

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
          <div className="fixed top-4 left-4 z-50">
            {admin && (
              <form action="/api/logout" method="post">
                <Button text="logout" variant="outline" size="small" />
              </form>
            )}
          </div>
          <main className="flex min-h-screen flex-col">
            <div className="flex-grow pb-16">
              {children}
            </div>
            <Copyright />
            <BoidProfiler />
            <InfiniteScroll />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
