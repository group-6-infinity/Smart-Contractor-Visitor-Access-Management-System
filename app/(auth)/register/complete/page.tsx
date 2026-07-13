import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RegComplete } from "@/components/layouts/auth/reg-complete";
import AuthLayout from "@/components/layouts/auth/auth-layout";
import RegisterCompleteHeader from "@/components/layouts/auth/register-complete-header";

export default async function RegisterCompletePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pending_tracking_token")?.value;
  if (!token) redirect("/");

  return (
    <>
      <AuthLayout>
        <div className="space-y-10 max-w-2xl overflow-hidden">
          <RegisterCompleteHeader />
          <RegComplete token={token} />
          <p className="border-border text-muted-foreground rounded-md border border-dashed p-3">
            Please save this link to track your registration status and submit
            future visit requests. A tracking link has also been sent to your
            registered email. If you dont see it in your inbox, please check
            your spam folder.
          </p>
          <Link
            href={`/track-status/${token}`}
            className={cn(
              buttonVariants(),
              "w-full cursor-pointer py-8! text-lg font-semibold",
            )}
          >
            Go To Tracking Page
          </Link>
        </div>
      </AuthLayout>
    </>
  );
}
