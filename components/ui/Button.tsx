import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-40 disabled:pointer-events-none",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        variant === "primary" &&
          "bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700",
        variant === "secondary" &&
          "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600",
        variant === "ghost" &&
          "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
