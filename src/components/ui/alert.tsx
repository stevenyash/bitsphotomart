import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

export type AlertVariant = "default" | "success" | "error" | "warning" | "info";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
          {
            "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive":
              variant === "error",
            "border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-600":
              variant === "success",
            "border-yellow-500/50 text-yellow-700 dark:border-yellow-500 [&>svg]:text-yellow-600":
              variant === "warning",
            "border-blue-500/50 text-blue-700 dark:border-blue-500 [&>svg]:text-blue-600":
              variant === "info",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

// Helper component to render icon based on variant
function AlertIcon({ variant }: { variant?: AlertVariant }) {
  switch (variant) {
    case "success":
      return <CheckCircle className="h-4 w-4" />;
    case "error":
      return <XCircle className="h-4 w-4" />;
    case "warning":
      return <AlertCircle className="h-4 w-4" />;
    case "info":
      return <Info className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

export { Alert, AlertTitle, AlertDescription, AlertIcon };
