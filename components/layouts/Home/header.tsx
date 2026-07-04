export default function Header() {
  return (
    <section
      id="main__header"
      className="main_titles mx-auto space-y-4 text-center"
    >
      <p className="text-primary text-xs tracking-[.10em] uppercase md:text-base md:tracking-[.25em]">
        visitor & contractor management
      </p>
      <h1 className="text-center text-3xl font-bold sm:text-4xl md:text-6xl">
        Register Gate Access
      </h1>
      <p className="text-muted-foreground mx-auto -mt-2 max-w-lg text-center text-sm leading-loose text-balance md:text-lg">
        Select your access type to begin pre registration Bring valid ID for
        verification at the gate
      </p>
    </section>
  );
}
