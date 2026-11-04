import type * as React from "react"
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { cn } from "@/lib/utils"

const noticeTones = {
  info: "border-primary/40 bg-primary/5 text-foreground",
  success: "border-primary/40 bg-primary/10 text-foreground",
  warning: "border-brand-accent/50 bg-brand-accent/10 text-foreground",
  error: "border-destructive/40 bg-destructive/10 text-foreground",
} as const

const noticeIcons = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
} as const

type NoticeProps = Omit<React.ComponentProps<typeof Alert>, "title"> & {
  tone?: keyof typeof noticeTones
  title?: string
}

function Notice({
  tone = "info",
  title,
  className,
  children,
  ...props
}: NoticeProps) {
  const Icon = noticeIcons[tone]

  return (
    <Alert
      role={tone === "error" ? "alert" : "status"}
      className={cn(noticeTones[tone], className)}
      {...props}
    >
      <Icon aria-hidden="true" />
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription
        className={tone === "error" ? "text-destructive" : undefined}
      >
        {children}
      </AlertDescription>
    </Alert>
  )
}

export { Notice, type NoticeProps }
