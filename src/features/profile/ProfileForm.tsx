"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  studentProfileSchema,
  type StudentProfileInput,
} from "@/features/profile/validation";
import { Button } from "@/components/ui/button";
import { FieldWrapper, InputField, inputClasses } from "@/components/ui/field";

const emptyToUndefined = (v: string) => (v === "" ? undefined : v);
const emptyToUndefinedNumber = (v: string) => (v === "" ? undefined : Number(v));

export function ProfileForm({
  defaults,
  email,
  registerNumber,
  department,
}: {
  defaults: { name: string; phoneNumber?: string; semester?: number };
  email: string;
  registerNumber: string | null;
  department: string | null;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentProfileInput>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: defaults,
  });

  async function onSubmit(values: StudentProfileInput) {
    setFormError(null);
    setSaved(false);
    const res = await fetch("/api/student/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
      setFormError(body?.message ?? "Couldn't save your profile — try again.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <InputField
        label="Full name"
        id="name"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />

      {/* Email is tied to your sign-in and can't be changed here. */}
      <FieldWrapper label="Email (fixed to your account)" htmlFor="email">
        <input
          id="email"
          value={email}
          disabled
          className={`${inputClasses(false)} text-ink-muted`}
        />
      </FieldWrapper>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FieldWrapper label="Register number" htmlFor="reg">
          <input
            id="reg"
            value={registerNumber ?? "—"}
            disabled
            className={`${inputClasses(false)} text-ink-muted`}
          />
        </FieldWrapper>
        <FieldWrapper label="Department" htmlFor="dept">
          <input
            id="dept"
            value={department ?? "—"}
            disabled
            className={`${inputClasses(false)} text-ink-muted`}
          />
        </FieldWrapper>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <InputField
          label="Phone number (optional)"
          id="phoneNumber"
          type="tel"
          autoComplete="tel"
          error={errors.phoneNumber?.message}
          {...register("phoneNumber", { setValueAs: emptyToUndefined })}
        />
        <InputField
          label="Semester (optional)"
          id="semester"
          type="number"
          min={1}
          max={10}
          error={errors.semester?.message}
          {...register("semester", { setValueAs: emptyToUndefinedNumber })}
        />
      </div>

      {formError && (
        <p
          role="alert"
          className="rounded-(--radius-input) bg-red-tint px-3.5 py-2.5 text-sm font-semibold text-red-ink"
        >
          {formError}
        </p>
      )}
      {saved && (
        <p
          role="status"
          className="rounded-(--radius-input) bg-success-tint px-3.5 py-2.5 text-sm font-semibold text-success-ink"
        >
          Profile saved.
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
