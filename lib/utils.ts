import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Color palette for up to 6 people
export const PERSON_COLORS = [
  { bar: "bg-violet-500", text: "text-violet-400", border: "border-violet-700", bg: "bg-violet-950/40" },
  { bar: "bg-amber-500",  text: "text-amber-400",  border: "border-amber-700",  bg: "bg-amber-950/40"  },
  { bar: "bg-emerald-500",text: "text-emerald-400",border: "border-emerald-700",bg: "bg-emerald-950/40"},
  { bar: "bg-rose-500",   text: "text-rose-400",   border: "border-rose-700",   bg: "bg-rose-950/40"   },
  { bar: "bg-sky-500",    text: "text-sky-400",    border: "border-sky-700",    bg: "bg-sky-950/40"    },
  { bar: "bg-orange-500", text: "text-orange-400", border: "border-orange-700", bg: "bg-orange-950/40" },
] as const;

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
