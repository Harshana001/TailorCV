import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import type { ResumeTemplate, TailoredResumeData } from "../resume-templates"

function hexToRgb(hex: string) {
  const n = parseInt(hex, 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

// Build a single/multi-page A4 PDF from the structured tailored resume using
// pdf-lib's standard fonts (no headless browser). Real data only.
export async function buildResumePdf(
  resume: TailoredResumeData,
  template: ResumeTemplate
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const regular = await pdf.embedFont(
    template.serif ? StandardFonts.TimesRoman : StandardFonts.Helvetica
  )
  const bold = await pdf.embedFont(
    template.serif ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold
  )
  const accent = hexToRgb(template.accentHex)
  const ink = rgb(0.1, 0.12, 0.16)
  const muted = rgb(0.42, 0.45, 0.5)

  const margin = 50
  const pageWidth = 595.28
  const pageHeight = 841.89
  const contentWidth = pageWidth - margin * 2

  let page: PDFPage = pdf.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) {
      page = pdf.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
    }
  }

  // Wrap text to the content width, returning the lines.
  const wrap = (text: string, font: PDFFont, size: number, width: number): string[] => {
    const words = text.split(/\s+/)
    const lines: string[] = []
    let line = ""
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(test, size) > width && line) {
        lines.push(line)
        line = word
      } else {
        line = test
      }
    }
    if (line) lines.push(line)
    return lines
  }

  const drawParagraph = (
    text: string,
    font: PDFFont,
    size: number,
    color = ink,
    indent = 0
  ) => {
    for (const line of wrap(text, font, size, contentWidth - indent)) {
      ensureSpace(size + 4)
      page.drawText(line, { x: margin + indent, y, size, font, color })
      y -= size + 4
    }
  }

  const drawHeading = (text: string) => {
    ensureSpace(28)
    y -= 10
    const label = template.uppercaseHeadings ? text.toUpperCase() : text
    page.drawText(label, { x: margin, y, size: 12, font: bold, color: accent })
    y -= 6
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1,
      color: accent,
    })
    y -= 12
  }

  // Header — name centred.
  const name = (resume.name ?? "Name not provided").toUpperCase()
  const nameSize = 20
  const nameWidth = bold.widthOfTextAtSize(name, nameSize)
  page.drawText(name, { x: (pageWidth - nameWidth) / 2, y, size: nameSize, font: bold, color: accent })
  y -= nameSize + 4
  if (resume.contact) {
    const cw = regular.widthOfTextAtSize(resume.contact, 10)
    page.drawText(resume.contact, { x: (pageWidth - cw) / 2, y, size: 10, font: regular, color: muted })
    y -= 16
  }

  if (resume.professionalSummary) {
    drawHeading("Professional Summary")
    drawParagraph(resume.professionalSummary, regular, 10.5)
  }

  if (resume.skills.length) {
    drawHeading("Skills")
    drawParagraph(resume.skills.join("  •  "), regular, 10.5)
  }

  if (resume.experience.length) {
    drawHeading("Experience")
    resume.experience.forEach((exp) => {
      ensureSpace(18)
      const header = `${exp.title}${exp.company ? `  —  ${exp.company}` : ""}`
      page.drawText(header.slice(0, 200), { x: margin, y, size: 11, font: bold, color: ink })
      if (exp.duration) {
        const dw = regular.widthOfTextAtSize(exp.duration, 9)
        page.drawText(exp.duration, { x: pageWidth - margin - dw, y, size: 9, font: regular, color: muted })
      }
      y -= 15
      exp.bullets.forEach((b) => {
        ensureSpace(14)
        page.drawText("•", { x: margin + 4, y, size: 10.5, font: regular, color: accent })
        drawParagraph(b, regular, 10.5, ink, 16)
      })
      y -= 4
    })
  }

  if (resume.education.length) {
    drawHeading("Education")
    resume.education.forEach((edu) => {
      ensureSpace(14)
      const header = `${edu.degree}${edu.institution ? `  —  ${edu.institution}` : ""}`
      page.drawText(header.slice(0, 200), { x: margin, y, size: 10.5, font: bold, color: ink })
      if (edu.year) {
        const yw = regular.widthOfTextAtSize(edu.year, 9)
        page.drawText(edu.year, { x: pageWidth - margin - yw, y, size: 9, font: regular, color: muted })
      }
      y -= 15
    })
  }

  if (resume.certifications.length) {
    drawHeading("Certifications")
    resume.certifications.forEach((c) => {
      ensureSpace(14)
      page.drawText("•", { x: margin + 4, y, size: 10.5, font: regular, color: accent })
      drawParagraph(c, regular, 10.5, ink, 16)
    })
  }

  return pdf.save()
}
