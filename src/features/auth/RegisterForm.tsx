"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/features/auth/validation";
import { Button } from "@/components/ui/button";
import { InputField, PasswordField, SelectField } from "@/components/ui/field";

const emptyToUndefined = (v: string) => (v === "" ? undefined : v);
const emptyToUndefinedNumber = (v: string) => (v === "" ? undefined : Number(v));

export function RegisterForm({ departments }: { departments: string[] }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
      if (body?.errors) {
        for (const [field, messages] of Object.entries(body.errors)) {
          setError(field as Path<RegisterInput>, {
            message: (messages as string[])[0],
          });
        }
      } else if (/email/i.test(body?.message ?? "")) {
        setError("email", { message: body.message });
      } else if (/register number/i.test(body?.message ?? "")) {
        setError("registerNumber", { message: body.message });
      } else {
        setFormError(body?.message ?? "Couldn't create your account. Try again.");
      }
      return;
    }
    router.push("/login?registered=1");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <InputField
        label="Full name"
        id="name"
        placeholder="Name"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <InputField
        label="Email"
        id="email"
        type="email"
        placeholder="Email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <InputField
          label="Register number"
          id="registerNumber"
          placeholder="Register number"
          error={errors.registerNumber?.message}
          {...register("registerNumber")}
        />
        <InputField
          label="Semester (optional)"
          id="semester"
          type="number"
          min={1}
          max={10}
          placeholder="Semester"
          error={errors.semester?.message}
          {...register("semester", { setValueAs: emptyToUndefinedNumber })}
        />
      </div>
      {departments.length > 0 ? (
        <SelectField
          label="Department"
          id="department"
          defaultValue=""
          error={errors.department?.message}
          {...register("department")}
        >
          <option value="" disabled>
            Choose your department
          </option>
          {departments.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </SelectField>
      ) : (
        <InputField
          label="Department"
          id="department"
          error={errors.department?.message}
          {...register("department")}
        />
      )}
      <InputField
        label="Phone number (optional)"
        id="phoneNumber"
        type="tel"
        placeholder="Phone number"
        autoComplete="tel"
        error={errors.phoneNumber?.message}
        {...register("phoneNumber", { setValueAs: emptyToUndefined })}
      />
      <PasswordField
        label="Password"
        id="password"
        placeholder="Password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <PasswordField
        label="Confirm password"
        id="confirmPassword"
        placeholder="Confirm password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
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
        {isSubmitting ? "Creating account…" : "Register"}
      </Button>
    </form>
  );
}
