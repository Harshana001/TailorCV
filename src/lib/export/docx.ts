import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx"
import type { ResumeTemplate, TailoredResumeData } from "../resume-templates"

// Build a DOCX file from the structured tailored resume. Contains only the
// candidate's real data — nothing is generated here beyond layout.
export async function buildResumeDocx(
  resume: TailoredResumeData,
  template: ResumeTemplate
): Promise<Buffer> {
  const font = template.serif ? "Georgia" : template.id === "technical" ? "Consolas" : "Calibri"
  const accent = template.accentHex.toUpperCase()

  const heading = (text: string): Paragraph =>
    new Paragraph({
      spacing: { before: 220, after: 80 },
      border: {
        bottom: { color: accent, style: BorderStyle.SINGLE, size: 6, space: 1 },
      },
      children: [
        new TextRun({
          text: template.uppercaseHeadings ? text.toUpperCase() : text,
          bold: true,
          color: accent,
          font,
          size: 24,
        }),
      ],
    })

  const body = (text: string, opts: { bold?: boolean; size?: number } = {}): TextRun =>
    new TextRun({ text, font, size: opts.size ?? 20, bold: opts.bold })

  const children: Paragraph[] = []

  // Header
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({
          text: (resume.name ?? "Name not provided").toUpperCase(),
          bold: true,
          font,
          size: 36,
          color: accent,
        }),
      ],
    })
  )
  if (resume.contact) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [body(resume.contact, { size: 18 })],
      })
    )
  }

  if (resume.professionalSummary) {
    children.push(heading("Professional Summary"))
    children.push(new Paragraph({ children: [body(resume.professionalSummary)] }))
  }

  if (resume.skills.length) {
    children.push(heading("Skills"))
    children.push(new Paragraph({ children: [body(resume.skills.join("  •  "))] }))
  }

  if (resume.experience.length) {
    children.push(heading("Experience"))
    resume.experience.forEach((exp) => {
      children.push(
        new Paragraph({
          spacing: { before: 120 },
          children: [
            body(exp.title, { bold: true }),
            body(exp.company ? `  —  ${exp.company}` : ""),
            body(exp.duration ? `   (${exp.duration})` : "", { size: 18 }),
          ],
        })
      )
      exp.bullets.forEach((b) =>
        children.push(new Paragraph({ bullet: { level: 0 }, children: [body(b)] }))
      )
    })
  }

  if (resume.education.length) {
    children.push(heading("Education"))
    resume.education.forEach((edu) =>
      children.push(
        new Paragraph({
          children: [
            body(edu.degree, { bold: true }),
            body(edu.institution ? `  —  ${edu.institution}` : ""),
            body(edu.year ? `   (${edu.year})` : "", { size: 18 }),
          ],
        })
      )
    )
  }

  if (resume.certifications.length) {
    children.push(heading("Certifications"))
    resume.certifications.forEach((c) =>
      children.push(new Paragraph({ bullet: { level: 0 }, children: [body(c)] }))
    )
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  })

  return Packer.toBuffer(doc)
}
