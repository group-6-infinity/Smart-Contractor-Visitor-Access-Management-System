import * as z from "zod";
import { Control } from "react-hook-form"
import { praRegisterSchema } from "@/schema/pra-register-schema"

type RegisterFormValues = z.infer<typeof praRegisterSchema>
export interface RegisterTabBasicInfoProps {
  control: Control<RegisterFormValues>
  onContinue: () => void,
  isSubmitting?: boolean
}
