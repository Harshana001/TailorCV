import { CVUpload } from "@/components/resume/cv-upload"
import { FileText, Shield, Zap } from "lucide-react"

export const metadata = {
  title: "Upload CV — TailorCV",
}

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
          <FileText className="h-7 w-7 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Upload your CV</h1>
        <p className="mt-3 text-slate-600">
          We parse your CV and extract your experience, skills, and education.
        </p>
      </div>

      <CVUpload />

      <div className="mt-10 flex flex-wrap justify-center gap-8">
        {[
          { icon: Shield, text: "Your data is private and secure" },
          { icon: Zap, text: "Parsed in seconds" },
          { icon: FileText, text: "PDF, DOCX, TXT supported" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-sm text-slate-500">
            <Icon className="h-4 w-4 text-slate-400" />
            {text}
          </div>
        ))}
      </div>
    </div>
  )
}
