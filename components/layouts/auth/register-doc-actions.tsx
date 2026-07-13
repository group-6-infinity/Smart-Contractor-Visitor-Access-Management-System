import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function RegisterDocActions({
  onBack,
  onSubmit,
  isLoading,
}: {
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="mt-8 ml-auto w-full items-center justify-end gap-4 max-[350px]:space-y-4 min-[350px]:grid min-[350px]:grid-cols-[1fr_2fr] md:flex">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={onBack}
        disabled={isLoading}
        className="w-full cursor-pointer rounded-md px-6 py-6 font-semibold tracking-wider text-lg md:w-fit"
      >
        Back
      </Button>
      <Button
        type="button"
        onClick={onSubmit}
        size="lg"
        disabled={isLoading}
        className="w-full cursor-pointer rounded-md px-6 py-6 font-semibold tracking-wider text-lg md:w-fit"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Registration"
        )}
      </Button>
    </div>
  );
}
