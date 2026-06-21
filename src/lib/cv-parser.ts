import Anthropic from "@anthropic-ai/sdk" // eslint-disable-line

export interface ParsedCV {
  name: string | null
  email: string | null
  phone: string | null
  location: string | null
  summary: string | null
  skills: string[]
  experience: Experience[]
  education: Education[]
  certifications: string[]
  languages: string[]
  rawText: string
}

export interface Experience {
  title: string
  company: string
  duration: string
  description: string[]
}

export interface Education {
  degree: string
  institution: string
  year: string
  field: string | null
}

export async function parseFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const uint8 = new Uint8Array(buffer)

  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    return parsePdf(uint8)
  }

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".docx")
  ) {
    return parseDocx(uint8)
  }

  if (file.type === "text/plain" || file.name.endsWith(".txt")) {
    return new TextDecoder().decode(uint8)
  }

  throw new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.")
}

async function parsePdf(buffer: Uint8Array): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse")
  const result = await pdfParse(Buffer.from(buffer))
  return result.text as string
}

async function parseDocx(buffer: Uint8Array): Promise<string> {
  const mammoth = await import("mammoth")
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
  return result.value
}

export async function extractStructuredData(rawText: string): Promise<Omit<ParsedCV, "rawText">> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are a CV parser. Extract structured data from the resume text below.

RULES:
- Only extract information that is explicitly present in the text
- Do NOT invent, infer, or fabricate any information
- If a field is missing, use null or an empty array
- Keep skills, certifications, and languages as concise labels (1-4 words each)
- For experience entries, extract the role title, company name, date range, and bullet points as-is

Return a JSON object with exactly this structure:
{
  "name": "Full Name or null",
  "email": "email@example.com or null",
  "phone": "phone number or null",
  "location": "City, Country or null",
  "summary": "professional summary text or null",
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2020 – Dec 2022",
      "description": ["bullet point 1", "bullet point 2"]
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University Name",
      "year": "2019",
      "field": "Computer Science or null"
    }
  ],
  "certifications": ["cert1", "cert2"],
  "languages": ["English", "Spanish"]
}

RESUME TEXT:
${rawText.substring(0, 6000)}`

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON in response")
    const parsed = JSON.parse(jsonMatch[0])

    return {
      name: parsed.name ?? null,
      email: parsed.email ?? extractEmail(rawText),
      phone: parsed.phone ?? null,
      location: parsed.location ?? null,
      summary: parsed.summary ?? null,
      skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 40) : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience.slice(0, 15) : [],
      education: Array.isArray(parsed.education) ? parsed.education.slice(0, 5) : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications.slice(0, 15) : [],
      languages: Array.isArray(parsed.languages) ? parsed.languages.slice(0, 10) : [],
    }
  } catch {
    return fallbackExtract(rawText)
  }
}

function extractEmail(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
  return match ? match[0] : null
}

function fallbackExtract(rawText: string): Omit<ParsedCV, "rawText"> {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean)
  const email = extractEmail(rawText)
  const name = lines[0] && lines[0].length < 60 && /^[A-Za-z\s\-'\.]+$/.test(lines[0]) ? lines[0] : null

  return {
    name,
    email,
    phone: null,
    location: null,
    summary: null,
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    languages: [],
  }
}
