"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { FileText, Loader2, AlertCircle, Copy, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface GenerateResult {
  generatedResumeId: string
  jobDescriptionId: string
  content: string
  atsScore: number
}

export default function BuilderClient() {
  const searchParams = useSearchParams()
  const defaultResumeId = searchParams.get("resumeId") ?? ""

  const [resumeId, setResumeId] = useState(defaultResumeId)
  const [jobTitle, setJobTitle] = useState("")
  const [company, setCompany] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumeId || !jobTitle || !jobDescription) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobTitle, company, jobDescription }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Generation failed")
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result?.content) return
    await navigator.clipboard.writeText(result.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const scoreColor =
    (result?.atsScore ?? 0) >= 80 ? "text-emerald-600" :
    (result?.atsScore ?? 0) >= 60 ? "text-amber-600" :
    "text-red-600"

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <FileText className="h-6 w-6 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">ATS Resume Builder</h1>
        <p className="mt-2 text-slate-600">
          Paste a job description to generate an ATS-optimised resume from your real experience.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Only genuine experience is used. Nothing is invented or fabricated.
        </div>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="resumeId">Resume ID *</Label>
              <Input
                id="resumeId"
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                placeholder="Paste your resume ID from the upload step"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jobDescription">Job Description *</Label>
              <Textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here…"
                className="min-h-[200px]"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !resumeId || !jobTitle || !jobDescription}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                "Generate ATS Resume"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4" aria-live="polite">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Generated Resume</h2>
              <span className={`text-sm font-semibold ${scoreColor}`}>ATS Score: {result.atsScore}/100</span>
              <Badge variant={result.atsScore >= 80 ? "success" : result.atsScore >= 60 ? "warning" : "destructive"} className="text-xs">
                {result.atsScore >= 80 ? "Excellent" : result.atsScore >= 60 ? "Good" : "Needs Work"}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <><CheckCheck className="h-4 w-4 text-emerald-500" /> Copied</>
              ) : (
                <><Copy className="h-4 w-4" /> Copy</>
              )}
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-800">
                {result.content}
              </pre>
            </CardContent>
          </Card>

          <p className="text-xs text-slate-400">
            Read-only output. This resume uses only information from your uploaded CV. Copy and use in your application.
          </p>

          <div className="flex flex-col items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-slate-900">Want a cover letter too?</p>
              <p className="text-sm text-slate-600">Generate a personalised cover letter using this resume and job description.</p>
            </div>
            <a href={`/cover-letter?resumeId=${resumeId}&jobDescriptionId=${result.jobDescriptionId}&generatedResumeId=${result.generatedResumeId}`}>
              <Button className="shrink-0">Generate Cover Letter</Button>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
