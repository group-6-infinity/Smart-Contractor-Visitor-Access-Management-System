import { DocumentField } from "@/const/interfaces/document-field";
import { RegistrationType } from "@/const/enums/registration-type";

export const DOCUMENT_FIELDS: Record<RegistrationType, DocumentField[]> = {
  [RegistrationType.CONTRACTOR]: [
    { key: "ktp", label: "KTP / ID Card", accept: "image/*", required: true },
    { key: "bpjs", label: "BPJS Card", accept: "image/*,.pdf", required: true },
    {
      key: "sio",
      label: "SIO Certificate",
      accept: "image/*,.pdf",
      required: true,
    },
    {
      key: "sia",
      label: "SIA Certificate",
      accept: "image/*,.pdf",
      required: true,
    },
    { key: "face", label: "Face Photo", accept: "image/*", required: true },
  ],
  [RegistrationType.VISITOR]: [
    { key: "ktp", label: "KTP / ID Card", accept: "image/*", required: true },
    { key: "face", label: "Face Photo", accept: "image/*", required: true },
  ],
};
