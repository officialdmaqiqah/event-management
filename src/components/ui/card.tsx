import * as React from "react"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-xl border border-gray-200 bg-white text-gray-950 shadow ${className || ""}`}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col space-y-1.5 p-6 ${className || ""}`}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={`font-semibold leading-none tracking-tight ${className || ""}`}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={`text-sm text-gray-500 ${className || ""}`}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => {
    // Check if user specified all-around padding like p-0, p-4, sm:p-6
    const hasAllPadding = /(?:^|\s)(?:[a-z]+:)?p-\d+/.test(className)
    
    let basePadding = ""
    if (!hasAllPadding) {
      const hasTopPadding = /(?:^|\s)(?:[a-z]+:)?pt-\d+/.test(className)
      const hasBottomPadding = /(?:^|\s)(?:[a-z]+:)?pb-\d+/.test(className)
      const hasXPadding = /(?:^|\s)(?:[a-z]+:)?p[xlr]-\d+/.test(className)
      const hasYPadding = /(?:^|\s)(?:[a-z]+:)?py-\d+/.test(className)

      const parts: string[] = []
      if (!hasXPadding) parts.push("px-6")
      if (!hasBottomPadding && !hasYPadding) parts.push("pb-6")
      if (!hasTopPadding && !hasYPadding) parts.push("pt-0")
      basePadding = parts.join(" ")
    }

    return (
      <div
        ref={ref}
        className={`${basePadding} ${className}`.trim()}
        {...props}
      />
    )
  }
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center p-6 pt-0 ${className || ""}`}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
