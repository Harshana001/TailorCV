import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Layers, Clock, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExportButtons } from "@/components/resume/export-buttons"

export const metadata = { title: "Resume Versions — TailorCV" }

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default async function VersionsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Each tailored/generated resume is a version, grouped under its source CV.
  const resumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      generatedResumes: {
        orderBy: { createdAt: "asc" },
        include: { jobDescription: true },
      },
    },
  })

  const withVersions = resumes.filter((r) => r.generatedResumes.length > 0)

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <Layers className="h-6 w-6 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Resume Versions</h1>
        <p className="mt-2 text-slate-600">
          Every resume you tailor is saved as a version. Export any version to PDF or DOCX.
        </p>
      </div>

      {withVersions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-slate-500">No resume versions yet.</p>
          <Link href="/tailor" className="mt-4 inline-block">
            <Button>Tailor your first resume</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {withVersions.map((resume) => (
            <div key={resume.id}>
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900">{resume.fileName}</h2>
                <span className="text-xs text-slate-400">
                  {resume.generatedResumes.length} version{resume.generatedResumes.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-3">
                {resume.generatedResumes.map((gen, i) => (
                  <Card key={gen.id}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="font-mono text-xs">
                          V{i + 1}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {gen.jobDescription.title}
                            {gen.jobDescription.company && (
                              <span className="font-normal text-slate-500"> · {gen.jobDescription.company}</span>
                            )}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="h-3 w-3" /> {timeAgo(gen.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {gen.atsScore != null && (
                          <Badge
                            variant={
                              gen.atsScore >= 80 ? "success" : gen.atsScore >= 60 ? "warning" : "secondary"
                            }
                            className="text-xs"
                          >
                            ATS {gen.atsScore}
                          </Badge>
                        )}
                        <ExportButtons generatedResumeId={gen.id} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
