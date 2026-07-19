"use client";
import * as z from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { praRegisterSchema } from "@/schema/pra-register-schema";
import { Tabs } from "@/components/ui/tabs";
import { RegistrationType } from "@/const/enums/registration-type";
import { DOCUMENT_FIELDS } from "@/const/data/register-document-item";
import RegisterTabHeader from "./register-tab-header";
import RegisterTabBasicInfo from "./register-basic-info";
import RegisterTabDocuments from "./register-documents";
import { BASIC_INFO_FIELDS } from "@/const/data/reg-basic-info-item";

export default function RegisterForms({
  registerType,
}: {
  registerType: RegistrationType;
}) {
  return <RegisterForm registerType={registerType} />;
}

function RegisterForm({ registerType }: { registerType: RegistrationType }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic-info");
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const documentFields = DOCUMENT_FIELDS[registerType] ?? [];

  const form = useForm<z.infer<typeof praRegisterSchema>>({
    resolver: zodResolver(praRegisterSchema),
    mode: "onBlur",
    defaultValues: {
      fullname: "",
      company: "",
      email: "",
      phone: "",
      biometricConsent: false,
    },
  });
  const {
    formState: { isSubmitting },
  } = form;

  async function handleContinue() {
    const isValid = await form.trigger([
      "fullname",
      "company",
      "email",
      "phone",
    ]);
    if (isValid) setActiveTab("documentations");
  }

  function handleFilesChange(updatedFiles: Record<string, File | null>) {
    setFiles(updatedFiles);
    setFileErrors((prev) => {
      const next = { ...prev };
      Object.entries(updatedFiles).forEach(([key, file]) => {
        if (file) delete next[key];
      });
      return next;
    });
  }

  function validateFiles(): boolean {
    const errors: Record<string, string> = {};
    documentFields.forEach(({ key, label, required }) => {
      if (required && !files[key]) {
        errors[key] = `${label} is required`;
      }
    });
    setFileErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(data: z.infer<typeof praRegisterSchema>) {
    if (!validateFiles()) return;

    setIsLoading(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("fullName", data.fullname);
      formData.append("company", data.company);
      formData.append("email", data.email);
      formData.append("phone", data.phone);
      formData.append("type", registerType.toUpperCase());

      documentFields.forEach(({ key }) => {
        if (files[key]) formData.append(key, files[key]!);
      });

      const res = await fetch("/api/register", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        setSubmitError(err.message ?? "Registration failed, please try again");
        return;
      }
      router.push(`/register/complete`);
    } catch {
      setSubmitError("Something went wrong, please try again");
    } finally {
      setIsLoading(false);
    }
  }

  const values = useWatch({ control: form.control });
  const isBasicInfoComplete = BASIC_INFO_FIELDS.every(
    ({ name }) => !!values[name]?.trim(),
  );

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      onChange={() => {
        if (submitError) setSubmitError(null);
      }}
      className="mr-auto w-full"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <RegisterTabHeader isBasicInfoComplete={isBasicInfoComplete} />
        <span className="bg-border my-4 block h-0.5 w-full rounded-sm" />

        <div className={activeTab === "basic-info" ? "block" : "hidden"}>
          <RegisterTabBasicInfo
            control={form.control}
            onContinue={handleContinue}
            isSubmitting={isSubmitting}
          />
        </div>

        <div className={activeTab === "documentations" ? "block" : "hidden"}>
          <RegisterTabDocuments
            registerType={registerType}
            documentFields={documentFields}
            fileErrors={fileErrors}
            submitError={submitError}
            isLoading={isLoading}
            onFilesChange={handleFilesChange}
            onBack={() => setActiveTab("basic-info")}
            onSubmit={form.handleSubmit(handleSubmit)}
            isSubmitting={isSubmitting}
            control={form.control}
          />
        </div>
      </Tabs>
    </form>
  );
}
