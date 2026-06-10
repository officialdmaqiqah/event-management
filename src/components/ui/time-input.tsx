import * as React from "react"
import { Input } from "@/components/ui/input"
import { Clock } from "lucide-react"

export interface TimeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || "")

    React.useEffect(() => {
      setInternalValue(value || "")
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/[^0-9:]/g, "")
      
      // Auto insert colon
      if (val.length === 2 && !val.includes(":") && internalValue.toString().length < val.length) {
        val += ":"
      }
      
      if (val.length > 5) {
        val = val.substring(0, 5)
      }

      setInternalValue(val)

      if (onChange) {
        e.target.value = val
        onChange(e)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      let val = e.target.value
      // Auto pad simple entries like "8" -> "08:00"
      if (val.length > 0 && !val.includes(":")) {
         const h = Math.min(Math.max(parseInt(val) || 0, 0), 23).toString().padStart(2, "0")
         val = `${h}:00`
      } else if (val.includes(":")) {
        let [h, m] = val.split(":")
        const hour = Math.min(Math.max(parseInt(h) || 0, 0), 23).toString().padStart(2, "0")
        const minute = Math.min(Math.max(parseInt(m) || 0, 0), 59).toString().padStart(2, "0")
        val = `${hour}:${minute}`
      }
      
      setInternalValue(val)
      if (onChange) {
        e.target.value = val
        onChange(e as unknown as React.ChangeEvent<HTMLInputElement>)
      }
      
      if (props.onBlur) props.onBlur(e)
    }

    return (
      <div className="relative flex items-center w-full">
        <Input
          type="text"
          placeholder="HH:mm"
          value={internalValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`pl-10 ${className || ""}`}
          ref={ref}
          {...props}
        />
        <Clock className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
      </div>
    )
  }
)
TimeInput.displayName = "TimeInput"
