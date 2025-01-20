import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

export const metadata: Metadata = {
  title: "sami f",
  description: "allo",
};


const deptnf = localFont({ src: "../../public/DepartureMonoNerdFontMono-Regular.otf" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={deptnf.className} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
