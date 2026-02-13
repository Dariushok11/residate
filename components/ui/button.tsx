import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost"
    size?: "default" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "default", ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center whitespace-nowrap transition-all focus:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer"

        const variants = {
            primary: "btn-primary",
            secondary: "btn-secondary",
            outline: "btn-outline",
            ghost: "btn-ghost",
        }

        const sizes = {
            default: "h-12 px-8 py-2 text-sm uppercase tracking-widest font-bold",
            sm: "h-9 px-4 text-xs uppercase tracking-wider",
            lg: "h-14 px-10 text-base uppercase tracking-widest",
        }

        return (
            <button
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
