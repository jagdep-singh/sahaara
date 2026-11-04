import { cn } from "cn"
import { Loader2Icon } from "lucide-react"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label="लोड हो रहा है"
      className={cn("size-6", className)}
      {...props}
    />
  )
}

export { Spinner }
