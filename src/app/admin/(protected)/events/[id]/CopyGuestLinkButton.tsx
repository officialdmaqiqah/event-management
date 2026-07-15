"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Link as LinkIcon, CheckCircle2 } from "lucide-react"

export default function CopyGuestLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    const url = `${window.location.origin}/panitia/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <Button 
      variant="outline" 
      onClick={copyLink}
      className={copied ? "border-green-500 text-green-700 bg-green-50" : "border-slate-300 text-slate-700"}
    >
      {copied ? (
        <><CheckCircle2 className="w-4 h-4 mr-2" /> Disalin</>
      ) : (
        <><LinkIcon className="w-4 h-4 mr-2" /> Link Panitia Luar</>
      )}
    </Button>
  )
}
