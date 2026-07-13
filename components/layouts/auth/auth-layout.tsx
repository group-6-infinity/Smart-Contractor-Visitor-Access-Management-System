import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="border-border flex min-h-screen flex-col items-center justify-center border">
      <section className="grid w-full md:grid-cols-[2fr_1fr]">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-10 p-4">
          {children}
        </div>

        <figure className="relative h-svh w-full max-md:hidden md:block">
          <Image
            src="/square-background-test.png"
            alt="square background"
            className="object-cover"
            fill
          />
        </figure>
      </section>
    </main>
  );
}
