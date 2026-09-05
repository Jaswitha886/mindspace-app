import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useState } from "react";

// A visible label above a white field with a hairline border. The error state
// turns the label, the border, and the helper text red together — colour is
// never the only cue, since the helper text states the problem in words.

type FieldWrapperProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

export function FieldWrapper({
  label,
  htmlFor,
  error,
  hint,
  children,
}: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className={`text-sm font-semibold ${error ? "text-red-ink" : "text-ink"}`}
      >
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-semibold text-red-ink">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-ink-muted">{hint}</p>
      )}
    </div>
  );
}

export const inputClasses = (hasError: boolean) =>
  `w-full rounded-(--radius-input) bg-surface px-3.5 py-2.5 text-[0.9375rem] text-ink placeholder:text-ink-muted border transition-colors duration-150 focus:outline-none focus-visible:outline-none ${
    hasError
      ? "border-red-light focus:border-red-light"
      : "border-line focus:border-brand-light"
  }`;


type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  error?: string;
  hint?: string;
};

export function InputField({ label, id, error, hint, ...props }: InputFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id} error={error} hint={hint}>
      <input
        id={id}
        aria-invalid={!!error}
        className={inputClasses(!!error)}
        {...props}
      />
    </FieldWrapper>
  );
}

type PasswordFieldProps = Omit<InputFieldProps, "type">;

export function PasswordField({ label, id, error, hint, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <FieldWrapper label={label} htmlFor={id} error={error} hint={hint}>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={!!error}
          className={`${inputClasses(!!error)} pr-28`}
          {...props}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-3 text-xs font-semibold text-brand-ink hover:underline"
          aria-controls={id}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? "Hide password" : "Show password"}
        </button>
      </div>
    </FieldWrapper>
  );
}

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  id: string;
  error?: string;
  hint?: string;
};

export function TextareaField({
  label,
  id,
  error,
  hint,
  rows = 4,
  ...props
}: TextareaFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id} error={error} hint={hint}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={!!error}
        className={`${inputClasses(!!error)} resize-y leading-relaxed`}
        {...props}
      />
    </FieldWrapper>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

export function SelectField({
  label,
  id,
  error,
  hint,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id} error={error} hint={hint}>
      <select
        id={id}
        aria-invalid={!!error}
        className={inputClasses(!!error)}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}
