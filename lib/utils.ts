import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Note: Even though we aren't using Tailwind classes for styling, 
// this utility is still useful for conditional class management if we were to switch,
// but for standard CSS modules or global CSS, we might just use clsx.
// However, sticking to the standard 'cn' pattern is good practice.
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
