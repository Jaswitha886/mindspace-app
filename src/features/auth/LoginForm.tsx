"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/features/auth/validation";
import { Button } from "@/components/ui/button";
import { InputField, PasswordField } from "@/components/ui/field";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
      setFormError(body?.message ?? "Couldn't sign you in. Try again.");
      return;
    }
    // Only follow same-site redirect targets; otherwise use the role dashboard.
    const target =
      redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
        ? redirectTo
        : body.data.redirectPath;
    router.push(target);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <InputField
        label="Email ID"
        id="email"
        type="email"
        placeholder="Email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <PasswordField
        label="Password"
        id="password"
        placeholder="Password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      {formError && (
        <p
          role="alert"
          className="rounded-(--radius-input) bg-red-tint px-3.5 py-2.5 text-sm font-semibold text-red-ink"
        >
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" fullWidth disabled={isSubmitting} className="mt-2">
        {isSubmitting ? "Signing in…" : "Login"}
      </Button>
    </form>
  );
}
