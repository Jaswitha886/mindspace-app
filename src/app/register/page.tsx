import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RegisterForm } from "@/features/auth/RegisterForm";
import { AuthShell } from "@/components/auth-shell";

// Department options come from the DB — don't bake them in at build time.
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });

  return (
    <AuthShell
      headline="Create your account"
      sub="For students. Counsellor accounts are set up by the wellness centre."
      footer={
        <p className="text-sm text-white/50">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-ink hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterForm departments={departments.map((d) => d.name)} />
    </AuthShell>
  );
}
