import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateCoverLetter } from "@/lib/ai"
import type { ParsedCV } from "@/lib/cv-parser"
import { checkRateLimit } from "@/lib/rate-limit"
import { trackEvent } from "@/lib/analytics"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { success } = await checkRateLimit(session.user.id)
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      )
    }

    const { resumeId, jobDescriptionId, generatedResumeId, jobTitle, jobDescription, company } =
      await req.json()

    if (!resumeId) {
      return NextResponse.json({ error: "resumeId is required" }, { status: 400 })
    }

    if (!jobDescriptionId && (!jobTitle || !jobDescription)) {
      return NextResponse.json(
        { error: "Provide either a jobDescriptionId or a jobTitle and jobDescription" },
        { status: 400 }
      )
    }

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId: session.user.id },
    })

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 })
    }

    // Use an existing job description, or create one from the supplied details.
    let jobDesc
    if (jobDescriptionId) {
      jobDesc = await prisma.jobDescription.findFirst({
        where: { id: jobDescriptionId, userId: session.user.id },
      })
      if (!jobDesc) {
        return NextResponse.json({ error: "Job description not found" }, { status: 404 })
      }
    } else {
      jobDesc = await prisma.jobDescription.create({
        data: {
          userId: session.user.id,
          title: jobTitle,
          company: company || null,
          content: jobDescription,
        },
      })
    }

    // If a tailored/optimised resume was produced, use it as the primary basis.
    let optimizedResume: string | undefined
    if (generatedResumeId) {
      const generated = await prisma.generatedResume.findFirst({
        where: { id: generatedResumeId, userId: session.user.id },
      })
      optimizedResume = generated?.content ?? undefined
    }

    const parsedCV: ParsedCV = {
      ...(resume.parsedData as object),
      rawText: resume.rawText,
    } as ParsedCV

    const content = await generateCoverLetter(
      parsedCV,
      jobDesc.content,
      jobDesc.title,
      jobDesc.company ?? "",
      optimizedResume
    )

    const saved = await prisma.coverLetter.create({
      data: {
        userId: session.user.id,
        resumeId,
        jobDescriptionId: jobDesc.id,
        generatedResumeId: generatedResumeId || null,
        content,
      },
    })

    await trackEvent(session.user.id, "cover_letter_generated", {
      coverLetterId: saved.id,
      jobTitle: jobDesc.title,
      fromOptimizedResume: !!optimizedResume,
    })

    return NextResponse.json({ coverLetterId: saved.id, jobDescriptionId: jobDesc.id, content })
  } catch (err) {
    console.error("Cover letter error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    )
  }
}
