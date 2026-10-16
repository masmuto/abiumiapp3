// API: /api/categories
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const where: any = {};
    if (type) where.type = type;
    const categories = await db.category.findMany({
      where,
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ data: categories });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, icon, color } = body;
    if (!name || !type) {
      return NextResponse.json({ error: "Nama & jenis wajib" }, { status: 400 });
    }
    // cek duplikat
    const existing = await db.category.findFirst({
      where: { name, type },
    });
    if (existing) {
      return NextResponse.json({ error: "Kategori sudah ada" }, { status: 400 });
    }
    const cat = await db.category.create({
      data: { name, type, icon: icon ?? null, color: color ?? "emerald" },
    });
    return NextResponse.json({ data: cat }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
