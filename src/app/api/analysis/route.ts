import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { analyzeCV } from "@/lib/ai"
import type { ParsedCV } from "@/lib/cv-parser"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { resumeId, jobTitle } = await req.json()

    if (!resumeId || !jobTitle) {
      return NextResponse.json({ error: "resumeId and jobTitle are required" }, { status: 400 })
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

    const analysis = await analyzeCV(parsedCV, jobTitle)

    const saved = await prisma.resumeAnalysis.create({
      data: {
        userId: session.user.id,
        resumeId,
        jobTitle,
        missingSkills: analysis.missingSkills,
        weakAreas: analysis.weakAreas,
        atsScore: analysis.atsScore,
        recommendations: analysis.recommendations,
        recruiterFeedback: analysis.recruiterFeedback,
        rawAnalysis: analysis.rawAnalysis,
      },
    })

    return NextResponse.json({ analysisId: saved.id, ...analysis })
  } catch (err) {
    console.error("Analysis error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    )
  }
}
