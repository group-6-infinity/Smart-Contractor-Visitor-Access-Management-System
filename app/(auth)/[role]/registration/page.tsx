import AuthLayout from "@/components/layouts/auth/auth-layout";
import RegisterForms from "@/components/layouts/auth/register-forms";
import { buttonVariants } from "@/components/ui/button";
import { RegistrationType } from "@/const/enums/registration-type";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  if (role !== "contractor" && role !== "visitor") return redirect("/");
  const registerType = role.toUpperCase() as RegistrationType;

  return (
    <AuthLayout>
      <>
        <Link
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "mr-auto flex items-center gap-2",
          )}
          href="/"
        >
          <ArrowLeft />
          Back to home
        </Link>
        <RegisterForms registerType={registerType as RegistrationType} />
      </>
    </AuthLayout>
  );
}
