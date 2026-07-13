import AuthLayout from "@/components/layouts/auth/auth-layout";
import RegisterForms from "@/components/layouts/auth/register-forms";
import { RegistrationType } from "@/const/enums/registration-type";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  if (role !== "contractor" && role !== "visitor")return redirect("/");
  const registerType = role.toUpperCase() as RegistrationType;


  return (
    <AuthLayout>
       <RegisterForms registerType={registerType as RegistrationType} />
    </AuthLayout>
  );
}
