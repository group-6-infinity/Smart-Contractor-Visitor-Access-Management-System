import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tabItems } from "@/const/data/register-tab-item";

export default function RegisterTabHeader({
  isBasicInfoComplete,
}: {
  isBasicInfoComplete: boolean;
}) {
  return (
    <TabsList className="space-x-10">
      {tabItems.map(({ title, value }, i) => {
        const isDisabled = value === "documentations" && !isBasicInfoComplete;

        return (
          <TabsTrigger
            key={value}
            value={value}
            disabled={isDisabled}
            className="data-[state=inactive]:text-muted-foreground group flex items-center gap-3 data-[state=active]:bg-transparent! data-[state=inactive]:cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 max-sm:text-sm"
          >
            <span className="group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground group-data-[state=inactive]:bg-muted group-data-[state=inactive]:text-muted-foreground flex aspect-square items-center justify-center rounded-sm px-3 py-1">
              {i + 1}
            </span>
            <p>{title}</p>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
