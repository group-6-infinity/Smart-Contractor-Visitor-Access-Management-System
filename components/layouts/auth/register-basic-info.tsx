import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { BASIC_INFO_FIELDS } from "@/const/data/reg-basic-info-item";
import { RegisterTabBasicInfoProps } from "@/const/interfaces/reg-tab-basic-info.interface";
import { Controller, useWatch } from "react-hook-form";
import RegisterBasicInfoAction from "./register-basic-info-action";

export default function RegisterTabBasicInfo({
  control,
  onContinue,
  isSubmitting = false,
}: RegisterTabBasicInfoProps) {
  const values = useWatch({ control });

  const isAllFilled = BASIC_INFO_FIELDS.every(
    ({ name }) => !!values[name]?.trim(),
  );

  return (
    <div className="flex w-full flex-col items-start justify-between">
      <FieldSet className="w-full">
        <FieldGroup className="grid gap-8 md:grid-cols-2">
          {BASIC_INFO_FIELDS.map(({ name, label, placeholder }) => (
            <Controller
              key={name}
              name={name}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={name} className="text-muted-foreground">
                    {label}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={name}
                    type={name === "email" ? "email" : "text"}
                    placeholder={placeholder}
                    className="border-border rounded-md border py-6!"
                    autoComplete="off"
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && (
                    <FieldError
                      errors={[fieldState.error]}
                      className="text-sm text-red-400 italic"
                    />
                  )}
                </Field>
              )}
            />
          ))}
        </FieldGroup>
      </FieldSet>

      <RegisterBasicInfoAction
        onContinue={onContinue}
        isAllFilled={isAllFilled}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
