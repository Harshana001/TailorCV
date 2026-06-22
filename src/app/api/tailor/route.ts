import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { analyzeJobDescription, tailorResume } from "@/lib/ai"
import type { ParsedCV } from "@/lib/cv-parser"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { resumeId, jobTitle, jobDescription, company } = await req.json()

    if (!resumeId || !jobTitle || !jobDescription) {
      return NextResponse.json(
        { error: "resumeId, jobTitle, and jobDescription are required" },
        { status: 400 }
      )
    }

    // Step 1 — load the parsed resume (parsing happened at upload time).
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

    // Step 2 — analyse the job description into structured requirements.
    const jdAnalysis = await analyzeJobDescription(jobDescription)

    // Step 3 — run the tailoring engine using only the candidate's real data.
    const tailored = await tailorResume(parsedCV, jobDescription, jdAnalysis)

    const jobDesc = await prisma.jobDescription.create({
      data: {
        userId: session.user.id,
        title: jobTitle,
        company: company || null,
        content: jobDescription,
        requiredSkills: jdAnalysis.requiredSkills,
        preferredSkills: jdAnalysis.preferredSkills,
        responsibilities: jdAnalysis.responsibilities,
      },
    })

    const generated = await prisma.generatedResume.create({
      data: {
        userId: session.user.id,
        resumeId,
        jobDescriptionId: jobDesc.id,
        content: JSON.stringify(tailored),
        atsScore: tailored.atsScore,
      },
    })

    return NextResponse.json({
      generatedResumeId: generated.id,
      jobDescriptionId: jobDesc.id,
      jdAnalysis,
      tailored,
    })
  } catch (err) {
    console.error("Tailor resume error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Tailoring failed" },
      { status: 500 }
    )
  }
}
