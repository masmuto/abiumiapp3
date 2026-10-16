// API: /api/accounts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const accounts = await db.account.findMany({
      where: { archived: false },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ data: accounts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, initialBalance, icon } = body;
    if (!name || !type) {
      return NextResponse.json({ error: "Nama & jenis wajib" }, { status: 400 });
    }
    const initial = Math.max(0, Math.round(initialBalance || 0));
    const acc = await db.account.create({
      data: {
        name,
        type,
        icon: icon ?? null,
        initialBalance: initial,
        balance: initial, // saldo awal = saldo berjalan
      },
    });
    return NextResponse.json({ data: acc }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
