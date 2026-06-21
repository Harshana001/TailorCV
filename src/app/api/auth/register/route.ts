import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json()

    if (!email || !name) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const user = await prisma.user.create({
      data: { name, email },
    })

    return NextResponse.json({ userId: user.id, message: "Account created successfully" })
  } catch (err) {
    console.error("Register error:", err)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
