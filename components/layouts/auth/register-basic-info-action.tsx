import { Button } from "@/components/ui/button";

export default function RegisterBasicInfoAction({
  onContinue,
  isAllFilled,
  isSubmitting,
}: {
  onContinue: () => void;
  isAllFilled: boolean;
  isSubmitting?: boolean;
}) {
  return (
    <div className="mt-8 ml-auto w-full sm:w-fit">
      <Button
        type="button"
        size="lg"
        onClick={onContinue}
        disabled={!isAllFilled || isSubmitting}
        className="w-full cursor-pointer rounded-md px-6 py-6 tracking-wider text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:w-fit"
      >
        Continue
      </Button>
    </div>
  );
}
