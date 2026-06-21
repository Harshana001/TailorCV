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

export function extractStructuredData(rawText: string): Omit<ParsedCV, "rawText"> {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean)

  return {
    name: extractName(lines),
    email: extractEmail(rawText),
    phone: extractPhone(rawText),
    location: extractLocation(lines),
    summary: extractSummary(lines),
    skills: extractSkills(rawText),
    experience: extractExperience(lines),
    education: extractEducation(lines),
    certifications: extractCertifications(rawText),
    languages: extractLanguages(rawText),
  }
}

function extractName(lines: string[]): string | null {
  if (lines.length === 0) return null
  const first = lines[0]
  if (first.length < 60 && /^[A-Za-z\s\-'\.]+$/.test(first)) return first
  return null
}

function extractEmail(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
  return match ? match[0] : null
}

function extractPhone(text: string): string | null {
  const match = text.match(/(\+?\d[\d\s\-().]{7,}\d)/)
  return match ? match[0].trim() : null
}

function extractLocation(lines: string[]): string | null {
  for (const line of lines.slice(0, 10)) {
    if (/\b(city|state|country|remote|\w+,\s*\w+)\b/i.test(line) && line.length < 80) {
      return line
    }
  }
  return null
}

function extractSummary(lines: string[]): string | null {
  const summaryIdx = lines.findIndex((l) =>
    /^(summary|profile|objective|about)/i.test(l)
  )
  if (summaryIdx === -1) return null
  const summaryLines: string[] = []
  for (let i = summaryIdx + 1; i < lines.length && summaryLines.length < 5; i++) {
    if (/^(experience|education|skills|work)/i.test(lines[i])) break
    summaryLines.push(lines[i])
  }
  return summaryLines.join(" ").substring(0, 500) || null
}

function extractSkills(text: string): string[] {
  const skillsSection = text.match(/skills[:\s]+([\s\S]*?)(?=\n\n|\nexperience|\neducation|\ncertification)/i)
  if (!skillsSection) return []
  return skillsSection[1]
    .split(/[,\n•·\-|]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 50)
    .slice(0, 30)
}

function extractExperience(lines: string[]): Experience[] {
  const experiences: Experience[] = []
  const expIdx = lines.findIndex((l) => /^(experience|work experience|employment)/i.test(l))
  if (expIdx === -1) return experiences

  const endIdx = lines.findIndex(
    (l, i) => i > expIdx && /^(education|skills|certification|languages)/i.test(l)
  )
  const expLines = lines.slice(expIdx + 1, endIdx === -1 ? undefined : endIdx)

  let current: Partial<Experience> | null = null
  for (const line of expLines) {
    if (/\d{4}/.test(line) && line.length < 80) {
      if (current?.title) experiences.push(current as Experience)
      current = { title: line, company: "", duration: "", description: [] }
    } else if (current) {
      if (!current.company) {
        current.company = line
      } else {
        current.description = [...(current.description || []), line]
      }
    }
  }
  if (current?.title) experiences.push(current as Experience)
  return experiences.slice(0, 10)
}

function extractEducation(lines: string[]): Education[] {
  const educations: Education[] = []
  const eduIdx = lines.findIndex((l) => /^(education|academic)/i.test(l))
  if (eduIdx === -1) return educations

  const endIdx = lines.findIndex(
    (l, i) => i > eduIdx && /^(skills|experience|certification|languages)/i.test(l)
  )
  const eduLines = lines.slice(eduIdx + 1, endIdx === -1 ? undefined : endIdx)

  for (let i = 0; i < eduLines.length; i++) {
    const line = eduLines[i]
    if (/bachelor|master|phd|diploma|degree|b\.sc|m\.sc|mba|b\.eng/i.test(line)) {
      educations.push({
        degree: line,
        institution: eduLines[i + 1] || "",
        year: (line.match(/\d{4}/) || [])[0] || "",
        field: null,
      })
    }
  }
  return educations.slice(0, 5)
}

function extractCertifications(text: string): string[] {
  const certSection = text.match(/certification[s]?[:\s]+([\s\S]*?)(?=\n\n|\nexperience|\neducation|\nskills)/i)
  if (!certSection) return []
  return certSection[1]
    .split(/[\n•·\-]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2 && s.length < 100)
    .slice(0, 10)
}

function extractLanguages(text: string): string[] {
  const langSection = text.match(/language[s]?[:\s]+([\s\S]*?)(?=\n\n|\nexperience|\neducation|\nskills)/i)
  if (!langSection) return []
  return langSection[1]
    .split(/[,\n•·\-]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 30)
    .slice(0, 8)
}
