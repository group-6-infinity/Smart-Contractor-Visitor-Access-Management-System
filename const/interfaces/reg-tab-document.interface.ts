import * as z from "zod";
import { DocumentField } from "@/components/common/file-upload";
import { RegistrationType } from "@/const/enums/registration-type";
import { Control } from "react-hook-form";
import { praRegisterSchema } from "@/schema/pra-register-schema";

export interface RegisterTabDocumentsProps {
  documentFields: DocumentField[];
  fileErrors: Record<string, string>;
  submitError: string | null;
  isLoading: boolean;
  registerType: RegistrationType;
  onFilesChange: (files: Record<string, File | null>) => void;
  onBack: () => void;
  isSubmitting?: boolean
  onSubmit: () => void;
  control: Control<z.infer<typeof praRegisterSchema>>;
}
