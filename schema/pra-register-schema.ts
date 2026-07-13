import * as z from "zod";

const handlingXss = (val: string) => !/<[^>]*>/.test(val);
export const praRegisterSchema = z.object({
  fullname: z
    .string()
    .toLowerCase()
    .trim()
    .min(2, "fullname must be at least 5 characters.")
    .max(50, "fullname must be at most 50 characters")
    .refine(handlingXss, { message: "Invalid characters detected" }),
  company: z
    .string()
    .toLowerCase()
    .trim()
    .min(2, "company name must be at least 2 characters")
    .max(50, "company name must be at most 50 characters")
    .refine(handlingXss, { message: "Invalid characters detected" }),
  email: z
    .string()
    .toLowerCase()
    .trim()
    .min(2, "email must be at least 2 characters")
    .max(50, "email must be at most 25 characters")
    .email("Enter a valid email address.")
    .max(100, "Email must be at most 100 characters.")
    .refine(handlingXss, { message: "Invalid characters detected" }),
  phone: z
    .string()
    .toLowerCase()
    .trim()
    .min(2, "phone number must be at least 2 characters")
    .max(15, "phone number must be at most 50 characters")
    .regex(
      /^(\+62|62|0)8[1-9][0-9]{6,10}$/,
      "Enter a valid Indonesian phone number (e.g. 08123456789).",
    )
    .refine(handlingXss, { message: "Invalid characters detected" }),
  biometricConsent: z.boolean().refine((value) => value === true, {
    message: "You must agree to the biometric consent.",
  }),
});
