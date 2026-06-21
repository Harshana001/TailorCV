"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, ChevronRight, User, Briefcase, GraduationCap, Award, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Status = "idle" | "uploading" | "parsed" | "error"

interface ParsedCV {
  name: string | null
  email: string | null
  phone: string | null
  location: string | null
  summary: string | null
  skills: string[]
  experience: Array<{ title: string; company: string; duration: string; description: string[] }>
  education: Array<{ degree: string; institution: string; year: string }>
  certifications: string[]
  languages: string[]
}

interface UploadResult {
  resumeId: string
  parsedData: ParsedCV
}

export function CVUpload() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  const handleFile = useCallback(async (file: File) => {
    const allowedExt = [".pdf", ".docx", ".txt"]
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."))

    if (!allowedExt.includes(ext)) {
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

      setUploadResult({ resumeId: data.resumeId, parsedData: data.parsedData })
      setStatus("parsed")
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.")
    }
  }, [])

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

  const handleContinue = () => {
    if (uploadResult) {
      router.push(`/analysis?resumeId=${uploadResult.resumeId}`)
    }
  }

  const handleReset = () => {
    setStatus("idle")
    setError(null)
    setUploadResult(null)
    setFileName(null)
  }

  if (status === "parsed" && uploadResult) {
    const cv = uploadResult.parsedData
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800">CV parsed successfully — <span className="font-mono text-xs">{fileName}</span></p>
            <p className="text-xs text-emerald-600 mt-0.5">Resume ID: <span className="font-mono">{uploadResult.resumeId}</span></p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Extracted Data</CardTitle>
            <p className="text-xs text-slate-500">Review what was extracted from your CV. This data is used for all AI features.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <User className="h-3.5 w-3.5" /> Contact
              </div>
              <div className="grid gap-1 text-sm">
                {cv.name && <p><span className="text-slate-500">Name:</span> <span className="text-slate-900">{cv.name}</span></p>}
                {cv.email && <p><span className="text-slate-500">Email:</span> <span className="text-slate-900">{cv.email}</span></p>}
                {cv.phone && <p><span className="text-slate-500">Phone:</span> <span className="text-slate-900">{cv.phone}</span></p>}
                {cv.location && <p><span className="text-slate-500">Location:</span> <span className="text-slate-900">{cv.location}</span></p>}
                {!cv.name && !cv.email && !cv.phone && !cv.location && (
                  <p className="text-slate-400 italic">No contact details detected</p>
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Award className="h-3.5 w-3.5" /> Skills ({cv.skills.length})
              </div>
              {cv.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {cv.skills.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No skills detected</p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Briefcase className="h-3.5 w-3.5" /> Experience ({cv.experience.length})
              </div>
              {cv.experience.length > 0 ? (
                <ul className="space-y-2">
                  {cv.experience.map((exp, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium text-slate-900">{exp.title}</span>
                      {exp.company && <span className="text-slate-500"> · {exp.company}</span>}
                      {exp.duration && <span className="text-slate-400 text-xs"> ({exp.duration})</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400 italic">No experience detected</p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <GraduationCap className="h-3.5 w-3.5" /> Education ({cv.education.length})
              </div>
              {cv.education.length > 0 ? (
                <ul className="space-y-1">
                  {cv.education.map((edu, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium text-slate-900">{edu.degree}</span>
                      {edu.institution && <span className="text-slate-500"> · {edu.institution}</span>}
                      {edu.year && <span className="text-slate-400"> ({edu.year})</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400 italic">No education detected</p>
              )}
            </div>

            {(cv.certifications.length > 0 || cv.languages.length > 0) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {cv.certifications.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <Award className="h-3.5 w-3.5" /> Certifications
                    </div>
                    <ul className="space-y-1">
                      {cv.certifications.map((c, i) => (
                        <li key={i} className="text-sm text-slate-700">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {cv.languages.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <Languages className="h-3.5 w-3.5" /> Languages
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cv.languages.map((l) => (
                        <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Upload a different CV
          </Button>
          <Button onClick={handleContinue} className="gap-2">
            Run CV Analysis <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <label htmlFor="cv-upload">
        <Card
          className={cn(
            "cursor-pointer border-2 border-dashed transition-colors",
            dragOver && "border-blue-400 bg-blue-50",
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
                  <p className="font-medium text-slate-900">Extracting data from your CV…</p>
                  <p className="text-sm text-slate-500">{fileName}</p>
                  <p className="text-xs text-slate-400 mt-1">AI is parsing the content — this takes a few seconds</p>
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
                    Supports PDF and DOCX · Max 10MB
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> PDF</span>
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> DOCX</span>
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
