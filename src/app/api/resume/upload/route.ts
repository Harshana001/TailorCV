import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseFile, extractStructuredData } from "@/lib/cv-parser"
import { checkRateLimit } from "@/lib/rate-limit"
import { uploadCvFile } from "@/lib/storage"
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

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const rawText = await parseFile(file)

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json(
        { error: "Could not extract text from file. Please ensure the file contains readable text." },
        { status: 422 }
      )
    }

    const parsedData = await extractStructuredData(rawText)

    // Store the original file (no-op when storage is not configured).
    const fileUrl = await uploadCvFile(buffer, file.name, session.user.id)

    const resume = await prisma.resume.create({
      data: {
        userId: session.user.id,
        fileName: file.name,
        fileType: file.type || "unknown",
        fileUrl,
        rawText,
        parsedData: parsedData as object,
      },
    })

    await trackEvent(session.user.id, "cv_uploaded", {
      resumeId: resume.id,
      fileType: file.type || "unknown",
      stored: !!fileUrl,
    })

    return NextResponse.json({ resumeId: resume.id, parsedData })
  } catch (err) {
    console.error("Upload error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    )
  }
}
