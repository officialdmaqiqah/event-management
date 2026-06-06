import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive"
  size?: "default" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    let baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
    
    let variantStyles = ""
    switch (variant) {
      case "default":
        variantStyles = "bg-gray-900 text-gray-50 shadow hover:bg-gray-900/90"
        break
      case "destructive":
        variantStyles = "bg-red-500 text-gray-50 shadow-sm hover:bg-red-500/90"
        break
      case "outline":
        variantStyles = "border border-gray-200 bg-white shadow-sm hover:bg-gray-100 hover:text-gray-900"
        break
      case "ghost":
        variantStyles = "hover:bg-gray-100 hover:text-gray-900"
        break
    }

    let sizeStyles = ""
    switch (size) {
      case "default":
        sizeStyles = "h-9 px-4 py-2"
        break
      case "sm":
        sizeStyles = "h-8 rounded-md px-3 text-xs"
        break
      case "lg":
        sizeStyles = "h-10 rounded-md px-8"
        break
    }

    return (
      <button
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className || ""}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
