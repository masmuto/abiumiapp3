// API: /api (health check)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const userCount = await db.user.count();
    const accountCount = await db.account.count();
    const categoryCount = await db.category.count();
    const transactionCount = await db.transaction.count();
    return NextResponse.json({
      ok: true,
      service: "Aplikasi Keuangan Keluarga",
      stats: { userCount, accountCount, categoryCount, transactionCount },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
