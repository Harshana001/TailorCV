"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { BarChart3, Loader2, AlertCircle, XCircle, Lightbulb, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface AnalysisResult {
  analysisId: string
  missingSkills: string[]
  weakAreas: string[]
  atsScore: number
  recommendations: string[]
  recruiterFeedback: string
}

export default function AnalysisClient() {
  const searchParams = useSearchParams()
  const defaultResumeId = searchParams.get("resumeId") ?? ""

  const [resumeId, setResumeId] = useState(defaultResumeId)
  const [jobTitle, setJobTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const handleAnalyse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumeId || !jobTitle) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobTitle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Analysis failed")
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const score = result?.atsScore ?? 0
  const scoreColor = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600"
  const scoreLabel = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Needs Work" : "Poor"
  const scoreBadgeVariant = score >= 80 ? "success" : score >= 60 ? "warning" : "destructive"

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <BarChart3 className="h-6 w-6 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">CV Analysis</h1>
        <p className="mt-2 text-slate-600">
          Enter the job title you&apos;re targeting to get an AI gap analysis and ATS score.
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <form onSubmit={handleAnalyse} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="resumeId">Resume ID</Label>
              <Input
                id="resumeId"
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                placeholder="Paste your resume ID from the upload step"
                required
              />
              <p className="text-xs text-slate-500">
                Find this in the URL after uploading, or in your dashboard.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Automation QA Engineer, Senior Software Engineer"
                required
              />
            </div>
            <Button type="submit" disabled={loading || !resumeId || !jobTitle} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analysing…
                </>
              ) : (
                "Run Analysis"
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
        <div className="space-y-6" aria-live="polite">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-600">ATS Compatibility Score</span>
                  <Badge variant={scoreBadgeVariant}>{scoreLabel}</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-5xl font-bold tabular-nums ${scoreColor}`}>{result.atsScore}</span>
                  <div className="flex-1">
                    <Progress value={result.atsScore} />
                  </div>
                  <span className="text-sm text-slate-400">/100</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Missing Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.missingSkills.length === 0 ? (
                  <p className="text-sm text-slate-500">No critical missing skills identified.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {result.missingSkills.map((skill) => (
                      <Badge key={skill} variant="destructive" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Weak Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.weakAreas.length === 0 ? (
                  <p className="text-sm text-slate-500">No significant weak areas found.</p>
                ) : (
                  <ul className="space-y-2">
                    {result.weakAreas.map((area) => (
                      <li key={area} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                        {area}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-5 w-5 text-blue-500" />
                Improvement Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.recommendations.length === 0 ? (
                <p className="text-sm text-slate-500">No specific suggestions at this time.</p>
              ) : (
                <ol className="space-y-3">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                        {i + 1}
                      </span>
                      {rec}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {result.recruiterFeedback && (
            <Card className="border-slate-200 bg-slate-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5 text-slate-500" />
                  Recruiter Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-slate-700 italic">&ldquo;{result.recruiterFeedback}&rdquo;</p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-slate-900">Ready to build your ATS resume?</p>
              <p className="text-sm text-slate-600">Use this analysis to generate a tailored resume.</p>
            </div>
            <a href={`/builder?resumeId=${resumeId}`}>
              <Button className="shrink-0">Build Resume</Button>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
