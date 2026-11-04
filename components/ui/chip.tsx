import type * as React from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const chipTones = {
  neutral: "border-border bg-muted text-foreground",
  primary: "border-primary bg-primary text-primary-foreground",
  accent: "border-brand-accent bg-brand-accent text-brand-accent-foreground",
  danger: "border-destructive/40 bg-destructive/10 text-destructive",
} as const

type ChipProps = React.ComponentProps<typeof Badge> & {
  tone?: keyof typeof chipTones
}

function Chip({ tone = "neutral", className, ...props }: ChipProps) {
  return (
    <Badge
      variant="outline"
      className={cn(chipTones[tone], className)}
      {...props}
    />
  )
}

export { Chip, type ChipProps }
