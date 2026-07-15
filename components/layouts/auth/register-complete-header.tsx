import { Check } from "lucide-react";

export default function RegisterCompleteHeader() {
  return (
    <div className="main__header flex flex-col items-center justify-center gap-2">
      <figure className="inline-block rounded-full bg-[#F5D1B3] p-3">
        <Check size={45} className="text-[#450A0A]" />
      </figure>
      <div className="main__header__titles mt-4 space-y-1.5 text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Registration Submitted
        </h2>
        <p className="text-muted-foreground mx-auto text-balance">
          Our HSE team will review your documents and update your status on the
          tracking page.
        </p>
      </div>
    </div>
  );
}
