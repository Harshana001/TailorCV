"use client"

import { useState } from "react"
import { FileDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type TemplateId } from "@/lib/resume-templates"

export function ExportButtons({
  generatedResumeId,
  template = "modern",
}: {
  generatedResumeId: string
  template?: TemplateId
}) {
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null)
  const [error, setError] = useState(false)

  const handleExport = async (format: "pdf" | "docx") => {
    setExporting(format)
    setError(false)
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generatedResumeId, format, template }),
      })
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `resume_${template}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError(true)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport("pdf")}
        disabled={exporting !== null}
        className="gap-1.5"
      >
        {exporting === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport("docx")}
        disabled={exporting !== null}
        className="gap-1.5"
      >
        {exporting === "docx" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
        DOCX
      </Button>
      {error && <span className="text-xs text-red-500">Failed — retry</span>}
    </div>
  )
}
