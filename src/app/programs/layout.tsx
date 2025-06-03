import HomeButton from "@/components/home-button";

export default function ProgramsLayout({
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
