import HomeButton from "@/components/home-button";

export default function ThoughtsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section>
      <HomeButton />
      {children}
    </section>
  );
}
