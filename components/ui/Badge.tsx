import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "muted";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-gray-100 text-gray-700 border border-gray-200",
        variant === "accent" && "bg-blue-50 text-blue-700 border border-blue-200",
        variant === "muted" && "bg-gray-100 text-gray-500 border border-gray-200",
        className
      )}
    >
      {children}
    </span>
  );
}
