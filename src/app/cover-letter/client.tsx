"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { FileText, Loader2, AlertCircle, Copy, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"

interface CoverLetterResult {
  coverLetterId: string
  content: string
}

export default function CoverLetterClient() {
  const searchParams = useSearchParams()
  const [resumeId, setResumeId] = useState(searchParams.get("resumeId") ?? "")
  const [jobDescriptionId, setJobDescriptionId] = useState(searchParams.get("jobDescriptionId") ?? "")
  const [generatedResumeId] = useState(searchParams.get("generatedResumeId") ?? "")
  const [jobTitle, setJobTitle] = useState("")
  const [company, setCompany] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CoverLetterResult | null>(null)
  const [copied, setCopied] = useState(false)

  const hasExistingJd = !!jobDescriptionId

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumeId) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      let jdId = jobDescriptionId

      if (!jdId) {
        const jdRes = await fetch("/api/generate-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeId, jobTitle, company, jobDescription, skipGenerate: true }),
        })
        const jdData = await jdRes.json()
        if (!jdRes.ok) throw new Error(jdData.error ?? "Failed to save job description")
        jdId = jdData.jobDescriptionId
        setJobDescriptionId(jdId)
      }

      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobDescriptionId: jdId, generatedResumeId: generatedResumeId || undefined }),
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <FileText className="h-6 w-6 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Cover Letter Generator</h1>
        <p className="mt-2 text-slate-600">
          Generate a personalised cover letter built from your real experience.
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
                placeholder="Your uploaded resume ID"
                required
              />
            </div>

            {hasExistingJd ? (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                Using job description from your generated resume. Ready to generate.
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="jobTitle">Job Title *</Label>
                    <Input
                      id="jobTitle"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Product Manager"
                      required={!hasExistingJd}
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
                    className="min-h-[160px]"
                    required={!hasExistingJd}
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={loading || !resumeId || (!hasExistingJd && (!jobTitle || !jobDescription))}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Writing cover letter…
                </>
              ) : (
                "Generate Cover Letter"
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
            <h2 className="text-lg font-semibold text-slate-900">Your Cover Letter</h2>
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
              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
                {result.content}
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-slate-400">
            Read-only output. This cover letter uses only information from your uploaded CV. Copy and personalise as needed.
          </p>
        </div>
      )}
    </div>
  )
}
