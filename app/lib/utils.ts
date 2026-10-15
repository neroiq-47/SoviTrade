import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...i: ClassValue[]) => twMerge(clsx(i));
export const usd = (n: number, d = 2) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: d, maximumFractionDigits: d });
export const pct = (n: number, d = 2) => `${n >= 0 ? "+" : ""}${n.toFixed(d)}%`;
export const compact = (n: number) => "$" + Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
