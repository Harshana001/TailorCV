import { Suspense } from "react"
import BuilderClient from "./client"

export const metadata = { title: "ATS Resume Builder — TailorCV" }

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-slate-500">Loading…</div>}>
      <BuilderClient />
    </Suspense>
  )
}
