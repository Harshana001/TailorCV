"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Status = "idle" | "uploading" | "success" | "error"

export function CVUpload() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]
    const allowedExt = [".pdf", ".docx", ".txt"]
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."))

    if (!allowed.includes(file.type) && !allowedExt.includes(ext)) {
      setError("Please upload a PDF, DOCX, or TXT file.")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB.")
      return
    }

    setFileName(file.name)
    setStatus("uploading")
    setError(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed")
      }

      setStatus("success")
      setTimeout(() => {
        router.push(`/dashboard?resumeId=${data.resumeId}`)
      }, 1200)
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.")
    }
  }, [router])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div className="mx-auto max-w-xl">
      <label htmlFor="cv-upload">
        <Card
          className={cn(
            "cursor-pointer border-2 border-dashed transition-colors",
            dragOver && "border-blue-400 bg-blue-50",
            status === "success" && "border-emerald-400 bg-emerald-50",
            status === "error" && "border-red-300 bg-red-50",
            status === "idle" && !dragOver && "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <CardContent className="flex flex-col items-center gap-4 py-12 px-8 text-center">
            {status === "uploading" && (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-slate-900">Parsing your CV…</p>
                  <p className="text-sm text-slate-500">{fileName}</p>
                </div>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle className="h-10 w-10 text-emerald-500" />
                <div>
                  <p className="font-medium text-slate-900">CV uploaded successfully!</p>
                  <p className="text-sm text-slate-500">Redirecting to dashboard…</p>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <AlertCircle className="h-10 w-10 text-red-500" />
                <div>
                  <p className="font-medium text-slate-900">Upload failed</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.preventDefault(); setStatus("idle"); setError(null) }}
                >
                  Try again
                </Button>
              </>
            )}

            {status === "idle" && (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                  <Upload className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    Drop your CV here, or <span className="text-blue-600">browse</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Supports PDF, DOCX, and TXT · Max 10MB
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> PDF</span>
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> DOCX</span>
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> TXT</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </label>
      <input
        id="cv-upload"
        type="file"
        accept=".pdf,.docx,.txt"
        className="sr-only"
        onChange={handleChange}
        disabled={status === "uploading"}
        aria-label="Upload CV file"
      />
    </div>
  )
}
