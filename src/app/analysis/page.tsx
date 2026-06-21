import { Suspense } from "react"
import AnalysisClient from "./client"

export const metadata = { title: "CV Analysis — TailorCV" }

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-slate-500">Loading…</div>}>
      <AnalysisClient />
    </Suspense>
  )
}
