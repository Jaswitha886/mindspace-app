import Link from "next/link";
import { LoginForm } from "@/features/auth/LoginForm";
import { AuthShell } from "@/components/auth-shell";
import { CheckCircleIcon } from "@/components/icons";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; registered?: string }>;
}) {
  const { redirect, registered } = await searchParams;

  return (
    <AuthShell
      headline="Welcome to MindSpace"
      sub="Sign in or create an account to get started."
      footer={
        <p className="text-sm text-white/50">
          New to MindSpace?{" "}
          <Link href="/register" className="font-semibold text-[#a29bfe] hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      {registered && (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-(--radius-input) bg-success-tint px-3.5 py-2.5 text-sm font-semibold text-success-ink"
        >
          <CheckCircleIcon className="h-[1.15rem] w-[1.15rem]" />
          Account created. Sign in to continue.
        </p>
      )}
      <LoginForm redirectTo={redirect} />
    </AuthShell>
  );
}
