import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateCoverLetter } from "@/lib/ai"
import type { ParsedCV } from "@/lib/cv-parser"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { resumeId, jobDescriptionId, generatedResumeId } = await req.json()

    if (!resumeId || !jobDescriptionId) {
      return NextResponse.json(
        { error: "resumeId and jobDescriptionId are required" },
        { status: 400 }
      )
    }

    const [resume, jobDesc] = await Promise.all([
      prisma.resume.findFirst({ where: { id: resumeId, userId: session.user.id } }),
      prisma.jobDescription.findFirst({ where: { id: jobDescriptionId, userId: session.user.id } }),
    ])

    if (!resume || !jobDesc) {
      return NextResponse.json({ error: "Resume or job description not found" }, { status: 404 })
    }

    const parsedCV: ParsedCV = {
      ...(resume.parsedData as object),
      rawText: resume.rawText,
    } as ParsedCV

    const content = await generateCoverLetter(
      parsedCV,
      jobDesc.content,
      jobDesc.title,
      jobDesc.company ?? ""
    )

    const saved = await prisma.coverLetter.create({
      data: {
        userId: session.user.id,
        resumeId,
        jobDescriptionId,
        generatedResumeId: generatedResumeId || null,
        content,
      },
    })

    return NextResponse.json({ coverLetterId: saved.id, content })
  } catch (err) {
    console.error("Cover letter error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    )
  }
}
