// API: /api/users
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const users = await db.user.findMany({
      select: { id: true, name: true, role: true, color: true, pin: true, createdAt: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: users });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
