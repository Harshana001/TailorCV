import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FileText, BarChart3, FileEdit, PlusCircle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Dashboard — TailorCV" }

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [resumes, analyses, generatedResumes, coverLetters] = await Promise.all([
    prisma.resume.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.resumeAnalysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.generatedResume.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { jobDescription: true },
    }),
    prisma.coverLetter.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { jobDescription: true },
    }),
  ])

  const stats = [
    { label: "CVs Uploaded", value: resumes.length, icon: FileText, href: "/upload" },
    { label: "Analyses Run", value: analyses.length, icon: BarChart3, href: "/analysis" },
    { label: "Resumes Generated", value: generatedResumes.length, icon: FileEdit, href: "/builder" },
    { label: "Cover Letters", value: coverLetters.length, icon: FileText, href: "/cover-letter" },
  ]

  const latestResume = resumes[0]

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-slate-500">Here&apos;s your resume activity at a glance.</p>
        </div>
        <Link href="/upload">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Upload CV
          </Button>
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{value}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {latestResume && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick actions</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link href={`/analysis?resumeId=${latestResume.id}`}>
              <Card className="cursor-pointer border-dashed transition-colors hover:border-blue-300 hover:bg-blue-50">
                <CardContent className="flex items-center gap-4 p-6">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-slate-900">Analyse latest CV</p>
                    <p className="text-xs text-slate-500">{latestResume.fileName}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/builder?resumeId=${latestResume.id}`}>
              <Card className="cursor-pointer border-dashed transition-colors hover:border-blue-300 hover:bg-blue-50">
                <CardContent className="flex items-center gap-4 p-6">
                  <FileEdit className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-slate-900">Build ATS resume</p>
                    <p className="text-xs text-slate-500">From latest CV</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/cover-letter?resumeId=${latestResume.id}`}>
              <Card className="cursor-pointer border-dashed transition-colors hover:border-blue-300 hover:bg-blue-50">
                <CardContent className="flex items-center gap-4 p-6">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-slate-900">Write cover letter</p>
                    <p className="text-xs text-slate-500">From latest CV</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
            <CardDescription>CV gap analyses you&apos;ve run</CardDescription>
          </CardHeader>
          <CardContent>
            {analyses.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500">No analyses yet.</p>
                <Link href="/analysis" className="mt-2 inline-block">
                  <Button variant="outline" size="sm">Run first analysis</Button>
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {analyses.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{a.jobTitle}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" /> {timeAgo(a.createdAt)}
                      </p>
                    </div>
                    <Badge variant={a.atsScore >= 80 ? "success" : a.atsScore >= 60 ? "warning" : "destructive"}>
                      {a.atsScore}/100
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Resumes</CardTitle>
            <CardDescription>ATS-optimised resumes you&apos;ve created</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedResumes.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500">No resumes generated yet.</p>
                <Link href="/builder" className="mt-2 inline-block">
                  <Button variant="outline" size="sm">Build first resume</Button>
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {generatedResumes.map((r) => (
                  <li key={r.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{r.jobDescription.title}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        {r.jobDescription.company && <span>{r.jobDescription.company} · </span>}
                        <Clock className="h-3 w-3" /> {timeAgo(r.createdAt)}
                      </p>
                    </div>
                    {r.atsScore && (
                      <Badge variant={r.atsScore >= 80 ? "success" : r.atsScore >= 60 ? "warning" : "secondary"}>
                        ATS {r.atsScore}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {resumes.length === 0 && (
        <div className="mt-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Start by uploading your CV</h2>
          <p className="mt-2 text-slate-500">Upload once, generate tailored resumes for every job.</p>
          <Link href="/upload" className="mt-6 inline-block">
            <Button size="lg" className="gap-2">
              <PlusCircle className="h-4 w-4" /> Upload CV
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
