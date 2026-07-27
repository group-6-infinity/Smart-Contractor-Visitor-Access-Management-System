import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
        <div className="max-w-2xl space-y-10 overflow-hidden">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground flex w-max items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <RegisterCompleteHeader />
          <RegComplete />
          <p className="border-border text-muted-foreground rounded-md border border-dashed p-3">
            Please save this link to track your registration status and submit
            future visit requests. A tracking link has also been sent to your
            registered email. If you dont see it in your inbox, please check
            your spam folder.
          </p>
          <div className="w-full flex items-center justify-center">
          <Link
            href="/track-status"
            className="w-full mx-auto text-center text-primary text-sm underline underline-offset-4"
            >
            Or track using your email here
          </Link>
            </div>
          {/* <Link
            href={`/track-status/${token}`}
            className={cn(
              buttonVariants(),
              "w-full cursor-pointer py-8! text-lg font-semibold",
            )}
          >
            Go To Tracking Page
          </Link> */}
        </div>
      </AuthLayout>
    </>
  );
}
