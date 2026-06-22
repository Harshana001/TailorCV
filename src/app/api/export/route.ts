import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import {
  RESUME_TEMPLATES,
  DEFAULT_TEMPLATE,
  isTemplateId,
  type TailoredResumeData,
} from "@/lib/resume-templates"
import { buildResumeDocx } from "@/lib/export/docx"
import { buildResumePdf } from "@/lib/export/pdf"

// Parse a stored GeneratedResume.content into structured data. Tailored resumes
// are stored as JSON; the legacy builder stored markdown, which we degrade into
// a single-section document so it still exports.
function toResumeData(content: string): TailoredResumeData {
  try {
    const parsed = JSON.parse(content)
    if (parsed && Array.isArray(parsed.experience)) {
      return {
        name: parsed.name ?? null,
        contact: parsed.contact ?? null,
        professionalSummary: parsed.professionalSummary ?? null,
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        experience: parsed.experience,
        education: Array.isArray(parsed.education) ? parsed.education : [],
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      }
    }
  } catch {
    // fall through to markdown handling
  }
  const lines = content.split("\n").map((l) => l.replace(/^#+\s*/, "").trim())
  const name = lines.find(Boolean) ?? null
  return {
    name,
    contact: null,
    professionalSummary: content.replace(/^#.*$/m, "").trim().slice(0, 4000),
    skills: [],
    experience: [],
    education: [],
    certifications: [],
  }
}

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

    const { generatedResumeId, format, template } = await req.json()

    if (!generatedResumeId || (format !== "pdf" && format !== "docx")) {
      return NextResponse.json(
        { error: "generatedResumeId and a format of 'pdf' or 'docx' are required" },
        { status: 400 }
      )
    }

    const generated = await prisma.generatedResume.findFirst({
      where: { id: generatedResumeId, userId: session.user.id },
    })

    if (!generated) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 })
    }

    const tpl = isTemplateId(template) ? RESUME_TEMPLATES[template] : RESUME_TEMPLATES[DEFAULT_TEMPLATE]
    const data = toResumeData(generated.content)
    const safeName = (data.name ?? "resume").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "")

    if (format === "docx") {
      const buffer = await buildResumeDocx(data, tpl)
      return new NextResponse(new Blob([new Uint8Array(buffer)]), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${safeName}_${tpl.id}.docx"`,
        },
      })
    }

    const pdfBytes = await buildResumePdf(data, tpl)
    return new NextResponse(new Blob([new Uint8Array(pdfBytes)]), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}_${tpl.id}.pdf"`,
      },
    })
  } catch (err) {
    console.error("Export error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Export failed" },
      { status: 500 }
    )
  }
}
