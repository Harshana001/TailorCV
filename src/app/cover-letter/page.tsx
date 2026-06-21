import { Suspense } from "react"
import CoverLetterClient from "./client"

export const metadata = { title: "Cover Letter Generator — TailorCV" }

export default function CoverLetterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-slate-500">Loading…</div>}>
      <CoverLetterClient />
    </Suspense>
  )
}
