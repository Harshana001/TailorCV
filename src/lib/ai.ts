import Anthropic from "@anthropic-ai/sdk" // eslint-disable-line
import type { ParsedCV } from "./cv-parser"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface AnalysisResult {
  missingSkills: string[]
  weakAreas: string[]
  atsScore: number
  recommendations: string[]
  recruiterFeedback: string
  rawAnalysis: string
}

export interface GeneratedResumeResult {
  content: string
  atsScore: number
}

export interface JobDescriptionAnalysis {
  requiredSkills: string[]
  preferredSkills: string[]
  responsibilities: string[]
}

export interface TailoredExperience {
  title: string
  company: string
  duration: string
  bullets: string[]
}

export interface TailoredEducation {
  degree: string
  institution: string
  year: string
}

export interface TailoredResume {
  name: string | null
  contact: string | null
  professionalSummary: string | null
  skills: string[]
  experience: TailoredExperience[]
  education: TailoredEducation[]
  certifications: string[]
  missingInformation: string[]
  matchedKeywords: string[]
  atsScore: number
}

export async function analyzeCV(
  parsedCV: ParsedCV,
  jobTitle: string
): Promise<AnalysisResult> {
  const prompt = `You are an ATS resume expert and experienced recruiter. Analyse this resume against the target role.

Target Role: ${jobTitle}

Resume:
Name: ${parsedCV.name ?? "Not provided"}
Skills: ${parsedCV.skills.join(", ") || "None listed"}
Experience: ${parsedCV.experience.map((e) => `${e.title} at ${e.company} (${e.duration})`).join("; ") || "None listed"}
Education: ${parsedCV.education.map((e) => `${e.degree} from ${e.institution}`).join("; ") || "None listed"}
Certifications: ${parsedCV.certifications.join(", ") || "None listed"}
Summary: ${parsedCV.summary ?? "Not provided"}

CRITICAL RULES — NEVER VIOLATE:
- Do NOT invent or suggest adding fake experience, certifications, or education
- Only identify genuinely missing skills and weak areas based on actual CV content
- If information is missing, state that it is missing — do not fabricate
- Be honest about ATS score based solely on existing content

Return ONLY a JSON object with exactly this structure:
{
  "atsScore": <integer 0-100>,
  "missingSkills": ["skill1", "skill2"],
  "weakAreas": ["area description 1", "area description 2"],
  "recommendations": ["specific actionable suggestion 1", "suggestion 2"],
  "recruiterFeedback": "2-3 sentence honest assessment a recruiter would give, based only on what is present"
}

atsScore: ATS compatibility score based on keyword match, completeness, and formatting signals
missingSkills: Skills commonly required for ${jobTitle} that are absent from this CV
weakAreas: CV sections that are thin, vague, or underdeveloped
recommendations: Specific improvements using only the candidate's real existing experience
recruiterFeedback: Honest recruiter perspective on this candidate's fit for the role`

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found")
    const parsed = JSON.parse(jsonMatch[0])
    return {
      missingSkills: parsed.missingSkills ?? [],
      weakAreas: parsed.weakAreas ?? [],
      atsScore: parsed.atsScore ?? 0,
      recommendations: parsed.recommendations ?? [],
      recruiterFeedback: parsed.recruiterFeedback ?? "",
      rawAnalysis: text,
    }
  } catch {
    return {
      missingSkills: [],
      weakAreas: [],
      atsScore: 0,
      recommendations: [],
      recruiterFeedback: "",
      rawAnalysis: text,
    }
  }
}

export async function generateATSResume(
  parsedCV: ParsedCV,
  jobDescription: string,
  jobTitle: string
): Promise<GeneratedResumeResult> {
  const prompt = `You are an expert ATS resume writer. Create an optimized resume for the following job using ONLY the information from the candidate's existing CV.

CRITICAL RULES — NEVER VIOLATE:
- Do NOT invent employment history
- Do NOT invent certifications
- Do NOT invent education
- Do NOT invent achievements
- Only rewrite and optimise existing information
- If information is missing from the CV, do not add it
- Use strong action verbs and ATS-friendly formatting

CANDIDATE'S EXISTING CV:
Name: ${parsedCV.name ?? "Not provided"}
Email: ${parsedCV.email ?? "Not provided"}
Phone: ${parsedCV.phone ?? "Not provided"}
Location: ${parsedCV.location ?? "Not provided"}
Summary: ${parsedCV.summary ?? "Not provided"}
Skills: ${parsedCV.skills.join(", ") || "None listed"}
Experience:
${parsedCV.experience.map((e) => `- ${e.title} at ${e.company} (${e.duration})\n  ${e.description.join("\n  ")}`).join("\n")}
Education:
${parsedCV.education.map((e) => `- ${e.degree}, ${e.institution}, ${e.year}`).join("\n") || "None listed"}
Certifications: ${parsedCV.certifications.join(", ") || "None listed"}
Languages: ${parsedCV.languages.join(", ") || "None listed"}

JOB TITLE: ${jobTitle}
JOB DESCRIPTION:
${jobDescription}

Generate an ATS-optimized resume in clean markdown format. Incorporate relevant keywords from the job description naturally into the candidate's real experience. Provide an estimated ATS score at the end.

Format:
# [Name]
[contact info]

## Professional Summary
[rewritten summary tailored to job - only if candidate has one]

## Skills
[skills most relevant to job listed first]

## Professional Experience
[reformatted experience with strong action verbs and metrics where available]

## Education
[education as provided]

## Certifications
[only real certifications from CV]

---
ATS_SCORE: [0-100]`

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  })

  const content = message.content[0].type === "text" ? message.content[0].text : ""
  const scoreMatch = content.match(/ATS_SCORE:\s*(\d+)/)
  const atsScore = scoreMatch ? parseInt(scoreMatch[1]) : 70

  return {
    content: content.replace(/---\nATS_SCORE:\s*\d+/, "").trim(),
    atsScore,
  }
}

// Phase 3 — Step 2: Analyse the job description into structured requirements.
export async function analyzeJobDescription(
  jobDescription: string
): Promise<JobDescriptionAnalysis> {
  const prompt = `You are an ATS and recruitment expert. Analyse the job description below and extract its requirements.

RULES:
- Only extract what is explicitly stated or strongly implied by the job description
- Do NOT invent requirements that are not present
- Keep each item a concise label or short phrase
- requiredSkills: skills/tools/qualifications stated as required or essential
- preferredSkills: skills described as nice-to-have, preferred, or a bonus
- responsibilities: the core duties and tasks of the role

JOB DESCRIPTION:
${jobDescription.substring(0, 6000)}

Return ONLY a JSON object with exactly this structure:
{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill1", "skill2"],
  "responsibilities": ["responsibility1", "responsibility2"]
}`

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found")
    const parsed = JSON.parse(jsonMatch[0])
    return {
      requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills.slice(0, 30) : [],
      preferredSkills: Array.isArray(parsed.preferredSkills) ? parsed.preferredSkills.slice(0, 30) : [],
      responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities.slice(0, 30) : [],
    }
  } catch {
    return { requiredSkills: [], preferredSkills: [], responsibilities: [] }
  }
}

// Phase 3 — Step 3: Resume Tailoring Engine. Produces a structured, ATS-optimised
// resume using ONLY the candidate's real information.
export async function tailorResume(
  parsedCV: ParsedCV,
  jobDescription: string,
  jdAnalysis: JobDescriptionAnalysis
): Promise<TailoredResume> {
  const prompt = `You are an ATS resume writer.

RULES — NEVER VIOLATE:
1. Never invent experience.
2. Never add fake skills.
3. Never invent certifications, education, or achievements.
4. Use only the information provided in the candidate's resume.
5. Rephrase for ATS optimisation using strong action verbs.
6. Include keywords from the job description ONLY where they genuinely match the candidate's real experience.
7. If important information is missing from the resume, list it under "missingInformation" — do NOT fabricate it.

CANDIDATE'S RESUME (the only source of truth):
Name: ${parsedCV.name ?? "Not provided"}
Email: ${parsedCV.email ?? "Not provided"}
Phone: ${parsedCV.phone ?? "Not provided"}
Location: ${parsedCV.location ?? "Not provided"}
Summary: ${parsedCV.summary ?? "Not provided"}
Skills: ${parsedCV.skills.join(", ") || "None listed"}
Experience:
${parsedCV.experience.map((e) => `- ${e.title} at ${e.company} (${e.duration})\n  ${e.description.join("\n  ")}`).join("\n") || "None listed"}
Education:
${parsedCV.education.map((e) => `- ${e.degree}, ${e.institution}, ${e.year}`).join("\n") || "None listed"}
Certifications: ${parsedCV.certifications.join(", ") || "None listed"}
Languages: ${parsedCV.languages.join(", ") || "None listed"}

JOB DESCRIPTION:
${jobDescription.substring(0, 4000)}

TARGET ROLE REQUIREMENTS (extracted):
Required skills: ${jdAnalysis.requiredSkills.join(", ") || "None"}
Preferred skills: ${jdAnalysis.preferredSkills.join(", ") || "None"}
Responsibilities: ${jdAnalysis.responsibilities.join("; ") || "None"}

Return ONLY a JSON object with exactly this structure:
{
  "name": "Candidate Name or null",
  "contact": "email · phone · location (omit missing parts) or null",
  "professionalSummary": "2-4 sentence summary tailored to the role, using only real background, or null if the candidate has no basis for one",
  "skills": ["most job-relevant real skills first"],
  "experience": [
    {
      "title": "real job title",
      "company": "real company",
      "duration": "real dates",
      "bullets": ["rephrased real achievement with action verb and JD keywords where truthful"]
    }
  ],
  "education": [
    { "degree": "real degree", "institution": "real institution", "year": "real year" }
  ],
  "certifications": ["only real certifications from the resume"],
  "missingInformation": ["honest note of any required skill or detail the resume lacks"],
  "matchedKeywords": ["job-description keywords genuinely supported by the resume"],
  "atsScore": <integer 0-100 estimated ATS match for this tailored resume>
}`

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found")
    const parsed = JSON.parse(jsonMatch[0])
    return {
      name: parsed.name ?? parsedCV.name ?? null,
      contact: parsed.contact ?? null,
      professionalSummary: parsed.professionalSummary ?? null,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      experience: Array.isArray(parsed.experience)
        ? parsed.experience.map((e: Partial<TailoredExperience>) => ({
            title: e.title ?? "",
            company: e.company ?? "",
            duration: e.duration ?? "",
            bullets: Array.isArray(e.bullets) ? e.bullets : [],
          }))
        : [],
      education: Array.isArray(parsed.education)
        ? parsed.education.map((e: Partial<TailoredEducation>) => ({
            degree: e.degree ?? "",
            institution: e.institution ?? "",
            year: e.year ?? "",
          }))
        : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : [],
      matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords : [],
      atsScore: typeof parsed.atsScore === "number" ? parsed.atsScore : 70,
    }
  } catch {
    // Fallback: surface the candidate's real data unmodified rather than failing.
    return {
      name: parsedCV.name,
      contact: [parsedCV.email, parsedCV.phone, parsedCV.location].filter(Boolean).join(" · ") || null,
      professionalSummary: parsedCV.summary,
      skills: parsedCV.skills,
      experience: parsedCV.experience.map((e) => ({
        title: e.title,
        company: e.company,
        duration: e.duration,
        bullets: e.description,
      })),
      education: parsedCV.education.map((e) => ({
        degree: e.degree,
        institution: e.institution,
        year: e.year,
      })),
      certifications: parsedCV.certifications,
      missingInformation: ["Automated tailoring was unavailable — showing your original resume content."],
      matchedKeywords: [],
      atsScore: 0,
    }
  }
}

export async function generateCoverLetter(
  parsedCV: ParsedCV,
  jobDescription: string,
  jobTitle: string,
  company: string
): Promise<string> {
  const prompt = `You are an expert cover letter writer. Write a compelling cover letter using ONLY the candidate's real experience.

CRITICAL RULES — NEVER VIOLATE:
- Do NOT invent employment history
- Do NOT invent certifications or achievements
- Do NOT invent education
- Only use and reframe real information from the CV
- If specific experience is missing, acknowledge what the candidate does offer instead

CANDIDATE'S CV:
Name: ${parsedCV.name ?? "Candidate"}
Skills: ${parsedCV.skills.join(", ") || "None listed"}
Experience: ${parsedCV.experience.map((e) => `${e.title} at ${e.company}`).join(", ") || "None listed"}
Education: ${parsedCV.education.map((e) => `${e.degree} from ${e.institution}`).join(", ") || "None listed"}
Summary: ${parsedCV.summary ?? "Not provided"}

JOB TITLE: ${jobTitle}
COMPANY: ${company || "the company"}
JOB DESCRIPTION:
${jobDescription}

Write a professional, personalised cover letter (3-4 paragraphs) that:
1. Opens with a strong hook connecting the candidate's background to the role
2. Highlights 2-3 relevant experiences or skills from their actual CV
3. Shows genuine interest in the company and role
4. Closes with a clear call to action

Use a professional but warm tone. Do not use generic filler phrases.`

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  })

  return message.content[0].type === "text" ? message.content[0].text : ""
}
