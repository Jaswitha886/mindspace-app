"use client";

import type { ReactNode } from "react";

export type AIMessageAuthor = "user" | "assistant";

export type AIMessageProps = {
  avatar?: ReactNode;
  bubble?: boolean;
  children: ReactNode;
  className?: string;
  from?: AIMessageAuthor;
};

export default function AIMessage({
  avatar,
  bubble = true,
  children,
  className = "",
  from = "assistant",
}: AIMessageProps) {
  const isUser = from === "user";

  return (
    <div
      className={`flex w-full gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"} ${className}`}
    >
      {avatar ? <div className="mt-0.5 shrink-0">{avatar}</div> : null}
      <div className={`flex min-w-0 flex-col ${isUser ? "items-end" : ""}`}>
        <div
          className={`w-fit max-w-[min(28rem,100%)] whitespace-pre-wrap text-sm leading-relaxed ${
            bubble
              ? `rounded-2xl px-3.5 py-2.5 ${
                  isUser
                    ? "rounded-br-md bg-brand text-white"
                    : "rounded-bl-md bg-sunken text-ink"
                }`
              : "text-ink"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
