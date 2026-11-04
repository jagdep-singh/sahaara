import type * as React from "react"

import { cn } from "@/lib/utils"

type ChoiceCardProps = Omit<React.ComponentProps<"input">, "type"> & {
  label: string
  description?: string
}

function ChoiceCard({
  label,
  description,
  className,
  id,
  ...props
}: ChoiceCardProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-14 cursor-pointer items-start gap-3 rounded-lg border-2 border-input bg-card p-4",
        "has-[:checked]:border-primary has-[:checked]:bg-primary/5",
        "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60",
        className
      )}
    >
      <input
        id={id}
        type="radio"
        className="mt-1 size-5 shrink-0 accent-primary"
        {...props}
      />
      <span className="flex flex-col gap-0.5">
        <span className="font-bold leading-snug">{label}</span>
        {description ? (
          <span className="text-base leading-normal text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  )
}

export { ChoiceCard, type ChoiceCardProps }
