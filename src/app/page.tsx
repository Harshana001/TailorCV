import Link from "next/link"
import { ArrowRight, FileText, BarChart3, FileEdit, CheckCircle, Zap, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const features = [
  {
    icon: FileText,
    title: "CV Analysis",
    description: "Upload your CV and get an instant AI-powered gap analysis against any job title. See your ATS score, missing skills, and weak areas.",
  },
  {
    icon: BarChart3,
    title: "ATS Resume Builder",
    description: "Paste a job description and get a tailored, ATS-optimised resume built from your real experience — no fabrication, ever.",
  },
  {
    icon: FileEdit,
    title: "Cover Letter Generator",
    description: "Generate a personalised cover letter that matches your background to the role using only your genuine experience.",
  },
]

const guarantees = [
  { icon: Shield, text: "No invented experience" },
  { icon: Shield, text: "No fake certifications" },
  { icon: CheckCircle, text: "Only real optimisation" },
  { icon: Zap, text: "ATS-ready output" },
]

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 inline-flex">
            AI-Powered Resume Intelligence
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Land the job with a{" "}
            <span className="text-blue-600">tailored resume</span>{" "}
            that actually works
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Upload your CV, analyse skill gaps against any job title, and generate
            ATS-optimised resumes and cover letters — built from your{" "}
            <strong className="font-semibold text-slate-900">real experience</strong>, nothing invented.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/upload">
              <Button size="lg" className="gap-2 px-8">
                Upload your CV <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg">
                Create free account
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {guarantees.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-slate-600">
                <Icon className="h-4 w-4 text-emerald-500" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900">Three tools, one platform</h2>
            <p className="mt-3 text-slate-600">Everything you need to go from uploaded CV to submitted application.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }, i) => (
              <Card key={title} className="relative overflow-hidden">
                <CardContent className="p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-semibold tabular-nums text-blue-600">0{i + 1}</span>
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
          </div>
          <ol className="relative space-y-8">
            {[
              { step: "1", title: "Upload your CV", desc: "PDF, DOCX, or TXT — we parse it instantly and extract your name, skills, experience, and education." },
              { step: "2", title: "Analyse against a job title", desc: "Enter the role you're targeting. Our AI scores your ATS compatibility and surfaces missing skills and weak areas." },
              { step: "3", title: "Generate a tailored resume", desc: "Paste the job description. We rewrite and optimise your existing content to match the role — no fabrication." },
              { step: "4", title: "Generate your cover letter", desc: "One click. A personalised cover letter built from your real background, matched to the specific job and company." },
            ].map(({ step, title, desc }) => (
              <li key={step} className="flex gap-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {step}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white">Ready to tailor your CV?</h2>
          <p className="mt-4 text-blue-100">Start for free. No credit card required.</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="px-8">
                Get started free
              </Button>
            </Link>
            <Link href="/upload">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
                Upload CV now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
