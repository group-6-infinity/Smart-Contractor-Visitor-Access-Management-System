"use client";

import { User, HardHat } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  VISITOR_STEPS,
  CONTRACTOR_STEPS,
} from "@/const/data/user-guide-steps";
import GuideStepRow from "@/components/layouts/UserGuidance/guide-step";

export default function GuideTabs() {
  return (
    <Tabs defaultValue="visitor" className="w-full">
      <TabsList className="bg-card border-border h-11 w-full border p-1">
        <TabsTrigger value="visitor" className="gap-2 cursor-pointer">
          <User />
          Visitor
        </TabsTrigger>
        <TabsTrigger value="contractor" className="gap-2 cursor-pointer">
          <HardHat />
          Contractor
        </TabsTrigger>
      </TabsList>

      <TabsContent value="visitor" className="mt-6">
        <p className="text-muted-foreground bg-card border-border mb-4 rounded-lg border p-4 text-sm leading-relaxed">
          For <b className="text-foreground">guests, meetings & official visits</b>
          e.g. representatives from another company or a student visit.
        </p>
        <div>
          {VISITOR_STEPS.map((step, i) => (
            <GuideStepRow
              key={step.step}
              step={step}
              isLast={i === VISITOR_STEPS.length - 1}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="contractor" className="mt-6">
        <p className="text-muted-foreground bg-card border-border mb-4 rounded-lg border p-4 text-sm leading-relaxed">
          For <b className="text-foreground">vendors & workers</b> performing
          on-site jobs.
        </p>
        <div>
          {CONTRACTOR_STEPS.map((step, i) => (
            <GuideStepRow
              key={step.step}
              step={step}
              isLast={i === CONTRACTOR_STEPS.length - 1}
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
