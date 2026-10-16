// API: /api/liabilities/[id]
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, amount, dueDate, note, settled } = body;
    const update: any = {};
    if (name !== undefined) update.name = name;
    if (amount !== undefined) update.amount = Math.round(amount);
    if (note !== undefined) update.note = note;
    if (settled !== undefined) update.settled = settled;
    if (dueDate !== undefined) {
      update.dueDate = dueDate ? new Date(dueDate + "T00:00:00") : null;
    }
    const item = await db.liability.update({ where: { id }, data: update });
    return NextResponse.json({ data: item });
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
    await db.liability.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
