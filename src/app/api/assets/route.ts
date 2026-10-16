// API: /api/assets
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const assets = await db.asset.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ data: assets });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, quantity, unitPrice, note } = body;
    if (!name || !type) {
      return NextResponse.json({ error: "Nama & jenis wajib" }, { status: 400 });
    }
    const q = parseFloat(quantity ?? 1);
    const up = Math.max(0, Math.round(unitPrice ?? 0));
    const asset = await db.asset.create({
      data: {
        name,
        type,
        quantity: q,
        unitPrice: up,
        value: Math.round(q * up),
        note: note ?? null,
      },
    });
    return NextResponse.json({ data: asset }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
