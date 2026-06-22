import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateATSResume } from "@/lib/ai"
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

    const { resumeId, jobTitle, jobDescription, company } = await req.json()

    if (!resumeId || !jobTitle || !jobDescription) {
      return NextResponse.json(
        { error: "resumeId, jobTitle, and jobDescription are required" },
        { status: 400 }
      )
    }

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId: session.user.id },
    })

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 })
    }

    const parsedCV: ParsedCV = {
      ...(resume.parsedData as object),
      rawText: resume.rawText,
    } as ParsedCV

    const result = await generateATSResume(parsedCV, jobDescription, jobTitle)

    const jobDesc = await prisma.jobDescription.create({
      data: {
        userId: session.user.id,
        title: jobTitle,
        company: company || null,
        content: jobDescription,
      },
    })

    const generated = await prisma.generatedResume.create({
      data: {
        userId: session.user.id,
        resumeId,
        jobDescriptionId: jobDesc.id,
        content: result.content,
        atsScore: result.atsScore,
      },
    })

    await trackEvent(session.user.id, "resume_generated", {
      generatedResumeId: generated.id,
      jobTitle,
      atsScore: result.atsScore,
    })

    return NextResponse.json({
      generatedResumeId: generated.id,
      jobDescriptionId: jobDesc.id,
      content: result.content,
      atsScore: result.atsScore,
    })
  } catch (err) {
    console.error("Generate resume error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    )
  }
}
