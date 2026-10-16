// API: /api/assets/[id]
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, type, quantity, unitPrice, note } = body;
    const update: any = {};
    if (name !== undefined) update.name = name;
    if (type !== undefined) update.type = type;
    if (typeof quantity === "number") update.quantity = quantity;
    if (typeof unitPrice === "number") update.unitPrice = Math.round(unitPrice);
    if (note !== undefined) update.note = note;

    // recalc value
    const current = await db.asset.findUniqueOrThrow({ where: { id } });
    const q = update.quantity ?? current.quantity;
    const up = update.unitPrice ?? current.unitPrice;
    update.value = Math.round(q * up);

    const asset = await db.asset.update({ where: { id }, data: update });
    return NextResponse.json({ data: asset });
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
    await db.asset.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
