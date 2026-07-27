import * as z from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Control, Controller } from "react-hook-form";
import { praRegisterSchema } from "@/schema/pra-register-schema";
import CustomDialog from "@/components/common/c-dialog";
import { Clock, FileText, Lock, ShieldCheck } from "lucide-react";

export function BiometrciConsent({
  control,
  disabled = false,
}: {
  control: Control<z.infer<typeof praRegisterSchema>>;
  disabled: boolean;
}) {
  return (
    <FieldGroup className="border-info-border mx-auto mt-4 w-full rounded-md border-2 border-dashed p-4">
      <Controller
        control={control}
        name="biometricConsent"
        render={({ field, fieldState }) => (
          <Field>
            <div className="flex items-start gap-4">
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                id="biometric-consent"
                className="cursor-pointer"
                disabled={disabled}
              />

              <FieldLabel
                htmlFor="biometric-consent"
                className="cursor-pointer text-base"
              >
                <CustomDialog
                  title={"Biometric Consent"}
                  trigger={
                    <div>
                      <p className="inline cursor-pointer underline">
                        Biometric consent
                      </p>
                      . I consent to the processing of my face photo & ID
                      documents for gate verification & safety compliance, in
                      accordance with UU PDP No. 27 Tahun 2022.
                    </div>
                  }
                >
                  <BiometricConsent />
                </CustomDialog>
              </FieldLabel>
            </div>

            {fieldState.error && (
              <FieldError className="ml-8">
                {fieldState.error.message}
              </FieldError>
            )}
          </Field>
        )}
      />
    </FieldGroup>
  );
}

function BiometricConsent() {
  return (
    <div className="space-y-6 px-5 text-sm leading-relaxed">
      <p className="text-muted-foreground leading-loose">
        Before you enter, we ask for your consent to process a photo of your
        face and your ID document. Here&apos;s what that means:
      </p>

      <div className="space-y-6">
        <ConsentPoint
          icon={<FileText className="text-info-foreground h-4 w-4" />}
          title="What we collect"
        >
          A face photo captured at the gate, plus the ID document you present
          (KTP, bpjs, or others ID).
        </ConsentPoint>

        <ConsentPoint
          icon={<ShieldCheck className="text-info-foreground h-4 w-4" />}
          title="Why we collect it"
        >
          To verify it&apos;s really you at the gate, and to meet the
          site&apos;s safety and access-control requirements.
        </ConsentPoint>

        <ConsentPoint
          icon={<Lock className="text-info-foreground h-4 w-4" />}
          title="How it's protected"
        >
          Stored encrypted and accessible only to authorized security staff.
          Never used for marketing or shared with third parties.
        </ConsentPoint>

        <ConsentPoint
          icon={<Clock className="text-info-foreground h-4 w-4" />}
          title="How long we keep it"
        >
          Kept only as long as needed for gate verification and audit purposes,
          then deleted or anonymized.
        </ConsentPoint>
      </div>

      <p className="text-muted-foreground border-t border-slate-100 pt-4 text-xs leading-loose">
        This processing follows UU PDP No. 27 Tahun 2022. You can withdraw
        consent or request access, correction, or deletion of your data at any
        time by contacting our data protection officer.
      </p>
    </div>
  );
}

function ConsentPoint({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="bg-info-muted-foreground mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full">
        {icon}
      </span>
      <div>
        <p className="text-md text-foreground font-medium">{title}</p>
        <p className="text-muted-foreground/50 mt-0.5">{children}</p>
      </div>
    </div>
  );
}
