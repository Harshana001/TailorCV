"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Wand2,
  Loader2,
  AlertCircle,
  Copy,
  CheckCheck,
  ShieldCheck,
  Target,
  ListChecks,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface JobDescriptionAnalysis {
  requiredSkills: string[]
  preferredSkills: string[]
  responsibilities: string[]
}

interface TailoredExperience {
  title: string
  company: string
  duration: string
  bullets: string[]
}

interface TailoredEducation {
  degree: string
  institution: string
  year: string
}

interface TailoredResume {
  name: string | null
  contact: string | null
  professionalSummary: string | null
  skills: string[]
  experience: TailoredExperience[]
  education: TailoredEducation[]
  certifications: string[]
  missingInformation: string[]
  matchedKeywords: string[]
  atsScore: number
}

interface TailorResult {
  generatedResumeId: string
  jobDescriptionId: string
  jdAnalysis: JobDescriptionAnalysis
  tailored: TailoredResume
}

const STEPS = [
  { n: 1, label: "Parse Resume" },
  { n: 2, label: "Analyse Job Description" },
  { n: 3, label: "Tailor Resume" },
]

function resumeToPlainText(r: TailoredResume): string {
  const lines: string[] = []
  if (r.name) lines.push(r.name.toUpperCase())
  if (r.contact) lines.push(r.contact)
  lines.push("")

  if (r.professionalSummary) {
    lines.push("PROFESSIONAL SUMMARY", "-".repeat(21), r.professionalSummary, "")
  }
  if (r.skills.length) {
    lines.push("SKILLS", "-".repeat(6), ...r.skills.map((s) => `• ${s}`), "")
  }
  if (r.experience.length) {
    lines.push("EXPERIENCE", "-".repeat(10))
    r.experience.forEach((e) => {
      lines.push(`${e.title}${e.company ? ` — ${e.company}` : ""}${e.duration ? ` (${e.duration})` : ""}`)
      e.bullets.forEach((b) => lines.push(`  • ${b}`))
      lines.push("")
    })
  }
  if (r.education.length) {
    lines.push("EDUCATION", "-".repeat(9))
    r.education.forEach((e) =>
      lines.push(`${e.degree}${e.institution ? ` — ${e.institution}` : ""}${e.year ? ` (${e.year})` : ""}`)
    )
    lines.push("")
  }
  if (r.certifications.length) {
    lines.push("CERTIFICATIONS", "-".repeat(14), ...r.certifications.map((c) => `• ${c}`), "")
  }
  return lines.join("\n").trim()
}

export default function TailorClient() {
  const searchParams = useSearchParams()
  const defaultResumeId = searchParams.get("resumeId") ?? ""

  const [resumeId, setResumeId] = useState(defaultResumeId)
  const [jobTitle, setJobTitle] = useState("")
  const [company, setCompany] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TailorResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleTailor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumeId || !jobTitle || !jobDescription) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobTitle, company, jobDescription }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Tailoring failed")
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result?.tailored) return
    await navigator.clipboard.writeText(resumeToPlainText(result.tailored))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tailored = result?.tailored
  const scoreColor =
    (tailored?.atsScore ?? 0) >= 80 ? "text-emerald-600" :
    (tailored?.atsScore ?? 0) >= 60 ? "text-amber-600" :
    "text-red-600"

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <Wand2 className="h-6 w-6 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Resume Tailoring Engine</h1>
        <p className="mt-2 text-slate-600">
          Match your CV to a specific job — parse, analyse the job description, and generate an
          ATS-optimised resume built only from your real experience.
        </p>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            For credibility and legal safety, nothing is invented. No fake experience, skills,
            certifications, or education — only your real information is rewritten and optimised. Any
            gaps are reported, not fabricated.
          </span>
        </div>
      </div>

      {/* Step indicator */}
      <ol className="mb-8 flex items-center gap-2">
        {STEPS.map((step, i) => {
          const active = loading || result
          return (
            <li key={step.n} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {step.n}
                </span>
                <span className={`text-sm font-medium ${active ? "text-slate-900" : "text-slate-400"}`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
            </li>
          )
        })}
      </ol>

      <Card className="mb-8">
        <CardContent className="p-6">
          <form onSubmit={handleTailor} className="space-y-4">
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
                  placeholder="e.g. Automation QA Engineer"
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
              className="w-full gap-2 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Tailoring your resume…
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Tailor My Resume
                </>
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

      {result && tailored && (
        <div className="space-y-6" aria-live="polite">
          {/* Step 2 output — Job Description analysis */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900">Job Requirements Detected</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Required Skills
                  </p>
                  {result.jdAnalysis.requiredSkills.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {result.jdAnalysis.requiredSkills.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-slate-400">None detected</p>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Preferred Skills
                  </p>
                  {result.jdAnalysis.preferredSkills.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {result.jdAnalysis.preferredSkills.map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-slate-400">None detected</p>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Responsibilities
                  </p>
                  {result.jdAnalysis.responsibilities.length ? (
                    <ul className="space-y-1 text-sm text-slate-600">
                      {result.jdAnalysis.responsibilities.slice(0, 6).map((r, i) => (
                        <li key={i} className="flex gap-1.5">
                          <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm italic text-slate-400">None detected</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tailored resume header / actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Tailored Resume</h2>
              <span className={`text-sm font-semibold ${scoreColor}`}>
                ATS Score: {tailored.atsScore}/100
              </span>
              <Badge
                variant={
                  tailored.atsScore >= 80 ? "success" : tailored.atsScore >= 60 ? "warning" : "destructive"
                }
                className="text-xs"
              >
                {tailored.atsScore >= 80 ? "Excellent" : tailored.atsScore >= 60 ? "Good" : "Needs Work"}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? (
                <><CheckCheck className="h-4 w-4 text-emerald-500" /> Copied</>
              ) : (
                <><Copy className="h-4 w-4" /> Copy as text</>
              )}
            </Button>
          </div>

          {/* Structured resume preview */}
          <Card>
            <CardContent className="resume-preview space-y-6 p-8">
              {/* Header */}
              <div className="border-b border-slate-200 pb-4 text-center">
                <h3 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
                  {tailored.name ?? "Name not provided"}
                </h3>
                {tailored.contact && (
                  <p className="mt-1 text-sm text-slate-500">{tailored.contact}</p>
                )}
              </div>

              {tailored.professionalSummary && (
                <section>
                  <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-blue-700">
                    Professional Summary
                  </h4>
                  <p className="text-sm leading-7 text-slate-700">{tailored.professionalSummary}</p>
                </section>
              )}

              {tailored.skills.length > 0 && (
                <section>
                  <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-blue-700">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {tailored.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {tailored.experience.length > 0 && (
                <section>
                  <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">
                    Experience
                  </h4>
                  <div className="space-y-4">
                    {tailored.experience.map((exp, i) => (
                      <div key={i}>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                          <p className="font-semibold text-slate-900">
                            {exp.title}
                            {exp.company && <span className="font-normal text-slate-600"> — {exp.company}</span>}
                          </p>
                          {exp.duration && (
                            <p className="text-xs text-slate-400">{exp.duration}</p>
                          )}
                        </div>
                        {exp.bullets.length > 0 && (
                          <ul className="mt-1.5 space-y-1">
                            {exp.bullets.map((b, j) => (
                              <li key={j} className="flex gap-2 text-sm leading-6 text-slate-700">
                                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {tailored.education.length > 0 && (
                <section>
                  <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-blue-700">
                    Education
                  </h4>
                  <ul className="space-y-1">
                    {tailored.education.map((edu, i) => (
                      <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
                        <span className="font-medium text-slate-900">
                          {edu.degree}
                          {edu.institution && <span className="font-normal text-slate-600"> — {edu.institution}</span>}
                        </span>
                        {edu.year && <span className="text-xs text-slate-400">{edu.year}</span>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {tailored.certifications.length > 0 && (
                <section>
                  <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-blue-700">
                    Certifications
                  </h4>
                  <ul className="space-y-1">
                    {tailored.certifications.map((c, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-700">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </CardContent>
          </Card>

          {/* Matched keywords */}
          {tailored.matchedKeywords.length > 0 && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <CheckCheck className="h-4 w-4" /> Job keywords matched from your real experience
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tailored.matchedKeywords.map((k) => (
                  <Badge key={k} variant="success" className="text-xs">{k}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Missing information — honest reporting, never fabricated */}
          {tailored.missingInformation.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
                <Info className="h-4 w-4" /> Missing information (not fabricated)
              </p>
              <ul className="space-y-1">
                {tailored.missingInformation.map((m, i) => (
                  <li key={i} className="flex gap-2 text-sm text-amber-700">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-slate-400">
            Read-only output built only from your uploaded CV. Review for accuracy, then copy into your
            application. Want a matching cover letter?{" "}
            <a
              className="text-blue-600 hover:underline"
              href={`/cover-letter?resumeId=${resumeId}&jobDescriptionId=${result.jobDescriptionId}&generatedResumeId=${result.generatedResumeId}`}
            >
              Generate one →
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
