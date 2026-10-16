// API: /api/accounts/[id]
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, type, icon, archived, adjustBalance } = body;

    const existing = await db.account.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Rekening tidak ditemukan" }, { status: 404 });
    }

    const update: any = {};
    if (name !== undefined) update.name = name;
    if (type !== undefined) update.type = type;
    if (icon !== undefined) update.icon = icon;
    if (archived !== undefined) update.archived = archived;

    // Jika ingin menyesuaikan saldo secara manual (mis. koreksi)
    if (typeof adjustBalance === "number") {
      update.balance = Math.round(adjustBalance);
    }

    const acc = await db.account.update({ where: { id }, data: update });
    return NextResponse.json({ data: acc });
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
    // Cek apakah ada transaksi yang memakai rekening ini
    const count = await db.transaction.count({
      where: { OR: [{ accountId: id }, { toAccountId: id }] },
    });
    if (count > 0) {
      // Soft-archive, jangan hapus
      const acc = await db.account.update({
        where: { id },
        data: { archived: true },
      });
      return NextResponse.json({
        data: acc,
        warning: `Rekening punya ${count} transaksi, diarsipkan saja (tidak dihapus)`,
      });
    }
    await db.account.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
