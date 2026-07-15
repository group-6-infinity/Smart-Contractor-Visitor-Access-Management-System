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

export function BiometrciConsent({
  control,
  disabled = false
}: {
  control: Control<z.infer<typeof praRegisterSchema>>;
  disabled: boolean
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
                Biometric consent. I consent to the processing of my face photo
                & ID documents for gate verification & safety compliance, in
                accordance with UU PDP No. 27 Tahun 2022.
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
