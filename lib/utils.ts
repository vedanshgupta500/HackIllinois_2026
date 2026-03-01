import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Color palette for up to 6 people (light-theme)
export const PERSON_COLORS = [
  { bar: "bg-blue-500",    text: "text-blue-700",    border: "border-blue-400",    bg: "bg-blue-50"    },
  { bar: "bg-slate-500",   text: "text-slate-700",   border: "border-slate-400",   bg: "bg-slate-50"   },
  { bar: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-400", bg: "bg-emerald-50" },
  { bar: "bg-orange-500",  text: "text-orange-700",  border: "border-orange-400",  bg: "bg-orange-50"  },
  { bar: "bg-indigo-500",  text: "text-indigo-700",  border: "border-indigo-400",  bg: "bg-indigo-50"  },
  { bar: "bg-rose-500",    text: "text-rose-700",    border: "border-rose-400",    bg: "bg-rose-50"    },
] as const;

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
