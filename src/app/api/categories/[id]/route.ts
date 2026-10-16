// API: /api/categories/[id]
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, icon, color } = body;
    const update: any = {};
    if (name !== undefined) update.name = name;
    if (icon !== undefined) update.icon = icon;
    if (color !== undefined) update.color = color;
    const cat = await db.category.update({ where: { id }, data: update });
    return NextResponse.json({ data: cat });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const count = await db.transaction.count({ where: { categoryId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: `Tidak bisa hapus: kategori dipakai ${count} transaksi` },
        { status: 400 }
      );
    }
    await db.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
