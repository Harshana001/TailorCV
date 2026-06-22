import { Suspense } from "react"
import TailorClient from "./client"

export const metadata = { title: "Resume Tailoring — TailorCV" }

export default function TailorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
          Loading…
        </div>
      }
    >
      <TailorClient />
    </Suspense>
  )
}
