"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  counsellorProfileSchema,
  type CounsellorProfileInput,
} from "@/features/profile/validation";
import { Button } from "@/components/ui/button";
import { FieldWrapper, InputField, inputClasses } from "@/components/ui/field";

const emptyToUndefined = (v: string) => (v === "" ? undefined : v);
const emptyToUndefinedNumber = (v: string) => (v === "" ? undefined : Number(v));

export function CounsellorProfileForm({
  defaults,
  role,
  department,
  specialization,
}: {
  defaults: {
    name: string;
    email: string;
    contactNumber?: string;
    yearsOfExperience?: number;
  };
  role: string;
  department: string | null;
  specialization: string | null;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CounsellorProfileInput>({
    resolver: zodResolver(counsellorProfileSchema),
    defaultValues: defaults,
  });

  async function onSubmit(values: CounsellorProfileInput) {
    setFormError(null);
    setSaved(false);
    const res = await fetch("/api/counsellor/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
      if (body?.errors) {
        for (const [field, messages] of Object.entries(body.errors)) {
          setError(field as Path<CounsellorProfileInput>, {
            message: (messages as string[])[0],
          });
        }
      } else {
        setFormError(body?.message ?? "Couldn't save your profile — try again.");
      }
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

      <InputField
        label="Email"
        id="email"
        type="email"
        autoComplete="email"
        hint="This is also how you sign in — changing it changes your login."
        error={errors.email?.message}
        {...register("email")}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <InputField
          label="Contact number (optional)"
          id="contactNumber"
          type="tel"
          autoComplete="tel"
          error={errors.contactNumber?.message}
          {...register("contactNumber", { setValueAs: emptyToUndefined })}
        />
        <InputField
          label="Years of experience (optional)"
          id="yearsOfExperience"
          type="number"
          min={0}
          max={60}
          error={errors.yearsOfExperience?.message}
          {...register("yearsOfExperience", { setValueAs: emptyToUndefinedNumber })}
        />
      </div>

      {/* Role is assigned by an admin — shown, never editable here. */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FieldWrapper label="Role (set by admin)" htmlFor="role">
          <input
            id="role"
            value={role}
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

      <FieldWrapper label="Specialization (set by admin)" htmlFor="spec">
        <input
          id="spec"
          value={specialization ?? "—"}
          disabled
          className={`${inputClasses(false)} text-ink-muted`}
        />
      </FieldWrapper>

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
