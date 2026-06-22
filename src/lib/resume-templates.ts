// Shared resume template definitions. Used by the on-screen preview and by both
// the PDF and DOCX exporters so a version looks consistent everywhere.

export type TemplateId = "modern" | "professional" | "executive" | "technical"

export interface ResumeTemplate {
  id: TemplateId
  name: string
  description: string
  /** Accent colour as a hex string without the leading # (for pdf-lib/docx). */
  accentHex: string
  /** Tailwind text colour class for the on-screen preview accent. */
  accentClass: string
  /** Tailwind border colour class for the preview header rule. */
  borderClass: string
  /** Preview body font family. */
  fontClass: string
  /** Serif vs sans — drives the exporter's standard font choice. */
  serif: boolean
  /** Whether section headings are uppercased. */
  uppercaseHeadings: boolean
}

export const RESUME_TEMPLATES: Record<TemplateId, ResumeTemplate> = {
  modern: {
    id: "modern",
    name: "Modern",
    description: "Clean sans-serif with a blue accent. Great for tech and startups.",
    accentHex: "2563eb",
    accentClass: "text-blue-700",
    borderClass: "border-blue-200",
    fontClass: "font-sans",
    serif: false,
    uppercaseHeadings: true,
  },
  professional: {
    id: "professional",
    name: "Professional",
    description: "Balanced serif headings. A safe, classic choice for any role.",
    accentHex: "0f172a",
    accentClass: "text-slate-800",
    borderClass: "border-slate-300",
    fontClass: "font-serif",
    serif: true,
    uppercaseHeadings: true,
  },
  executive: {
    id: "executive",
    name: "Executive",
    description: "Refined serif with a deep accent. Suited to senior and leadership roles.",
    accentHex: "7c2d12",
    accentClass: "text-amber-900",
    borderClass: "border-amber-300",
    fontClass: "font-serif",
    serif: true,
    uppercaseHeadings: true,
  },
  technical: {
    id: "technical",
    name: "Technical",
    description: "Compact, monospace-flavoured layout for engineering and QA roles.",
    accentHex: "0f766e",
    accentClass: "text-teal-700",
    borderClass: "border-teal-200",
    fontClass: "font-mono",
    serif: false,
    uppercaseHeadings: false,
  },
}

export const DEFAULT_TEMPLATE: TemplateId = "modern"

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && value in RESUME_TEMPLATES
}

// The structured tailored resume shape, shared with the AI layer and exporters.
export interface TailoredResumeData {
  name: string | null
  contact: string | null
  professionalSummary: string | null
  skills: string[]
  experience: { title: string; company: string; duration: string; bullets: string[] }[]
  education: { degree: string; institution: string; year: string }[]
  certifications: string[]
  missingInformation?: string[]
  matchedKeywords?: string[]
  atsScore?: number
}
