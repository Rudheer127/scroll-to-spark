"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";

type PasswordFieldProps = {
  autoComplete: "current-password" | "new-password";
  label?: string;
  error?: string;
  hint?: string;
  minLength?: number;
};

/** A password input with a button that shows or hides what was typed. */
export function PasswordField({
  autoComplete,
  label = "Password",
  error,
  hint,
  minLength,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Field label={label} htmlFor="password" error={error} hint={hint}>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          className={cn(inputClass, "min-h-12 pr-12")}
        />
        <Button
          variant="ghost"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
          className="absolute inset-y-0 right-0 px-3"
        >
          {visible ? (
            <EyeOff aria-hidden className="size-5" />
          ) : (
            <Eye aria-hidden className="size-5" />
          )}
        </Button>
      </div>
    </Field>
  );
}
