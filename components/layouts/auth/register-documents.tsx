import FileUpload from "@/components/common/file-upload";
import { RegisterTabDocumentsProps } from "@/const/interfaces/reg-tab-document.interface";
import { RegistrationType } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { BiometrciConsent } from "./biometric-consent";
import RegisterDocActions from "./register-doc-actions";

export default function RegisterTabDocuments({
  documentFields,
  fileErrors,
  submitError,
  isLoading,
  onFilesChange,
  registerType,
  onBack,
  onSubmit,
  isSubmitting = false,
  control,
}: RegisterTabDocumentsProps) {
  return (
    <div className="flex w-full flex-col items-start justify-between">
      <div className="w-full">
        <div
          className={cn(
            "grid w-full grid-cols-1 gap-4 md:gap-8",
            registerType === RegistrationType.VISITOR
              ? "md:grid-cols-2"
              : "md:grid-cols-3",
          )}
        >
          <FileUpload
            documents={documentFields}
            onFilesChange={onFilesChange}
            fileErrors={fileErrors}
            disabled={isSubmitting}
          />
        </div>

        {submitError && (
          <div className="bg-destructive-muted border-destructive-border text-destructive-muted-foreground mt-4 w-full rounded-md border px-4 py-3 text-sm">
            {submitError}
          </div>
        )}
      </div>

      <BiometrciConsent control={control} disabled={isSubmitting} />
      <RegisterDocActions
        onBack={onBack}
        onSubmit={onSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
