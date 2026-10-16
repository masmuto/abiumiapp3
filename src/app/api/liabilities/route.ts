// API: /api/liabilities
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const items = await db.liability.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ data: items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, amount, dueDate, note } = body;
    if (!name || !amount) {
      return NextResponse.json({ error: "Nama & nominal wajib" }, { status: 400 });
    }
    const item = await db.liability.create({
      data: {
        name,
        amount: Math.round(amount),
        dueDate: dueDate ? new Date(dueDate + "T00:00:00") : null,
        note: note ?? null,
      },
    });
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
