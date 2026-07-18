import type { ButtonHTMLAttributes } from "react";

// A filled green primary, a quiet secondary, a filled red destructive, a white
// outline, and a bare text link. Only one primary should appear per view — the
// accent means "this is the action", and it stops meaning that if everything
// wears it.

type Variant = "primary" | "secondary" | "destructive" | "outline" | "link";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:active:translate-y-0";

const variantClasses: Record<Variant, string> = {
  // Disabled keeps the green fill but swaps to green ink: white on the light
  // disabled fill is 1.6:1. Inactive controls are exempt from WCAG 1.4.3, but
  // "Confirm Booking" you can't read is still a broken button.
  primary:
    "rounded-(--radius-btn) bg-brand text-white shadow-(--shadow-btn) hover:bg-brand-hover disabled:bg-brand-disabled disabled:text-brand-ink disabled:shadow-none",
  secondary:
    "rounded-(--radius-btn) bg-sunken text-ink hover:bg-line disabled:text-ink-muted",
  destructive:
    "rounded-(--radius-btn) bg-red text-white shadow-(--shadow-btn) hover:bg-red-ink disabled:bg-red-tint disabled:text-red-ink/60",
  // Green at 25% reads as a hairline the accent tinted, not a grey box.
  outline:
    "rounded-(--radius-btn) bg-surface text-brand-ink border border-brand/25 hover:bg-brand/5 disabled:text-ink-muted disabled:border-line",
  link: "text-brand-ink hover:underline underline-offset-4 disabled:text-ink-muted disabled:no-underline",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}) {
  const sizing = variant === "link" ? "" : sizeClasses[size];
  return (
    <button
      className={`${base} ${variantClasses[variant]} ${sizing} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    />
  );
}

// The circular accent button (e.g. the "+" beside "Next Step").
export function IconButton({
  label,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white shadow-(--shadow-btn) transition-colors duration-150 hover:bg-brand-hover disabled:bg-brand-disabled ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
