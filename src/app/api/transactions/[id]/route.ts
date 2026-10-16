// API: /api/transactions/[id]
// Hapus transaksi - reverse saldo & anggaran sebelum delete
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.transaction.findUnique({
      where: { id },
      include: { account: true, toAccount: true, category: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    await db.$transaction(async (prisma) => {
      // Reverse saldo
      const acc = await prisma.account.findUniqueOrThrow({ where: { id: existing.accountId } });
      if (existing.type === "INCOME") {
        await prisma.account.update({
          where: { id: existing.accountId },
          data: { balance: acc.balance - existing.amount },
        });
      } else if (existing.type === "EXPENSE") {
        await prisma.account.update({
          where: { id: existing.accountId },
          data: { balance: acc.balance + existing.amount },
        });
      } else if (existing.type === "TRANSFER" && existing.toAccountId) {
        const toAcc = await prisma.account.findUniqueOrThrow({ where: { id: existing.toAccountId } });
        await prisma.account.update({
          where: { id: existing.accountId },
          data: { balance: acc.balance + existing.amount },
        });
        await prisma.account.update({
          where: { id: existing.toAccountId },
          data: { balance: toAcc.balance - existing.amount },
        });
      }

      // Reverse anggaran
      if (existing.type === "EXPENSE" && existing.categoryId) {
        const m = existing.date.getMonth() + 1;
        const y = existing.date.getFullYear();
        await prisma.budget.updateMany({
          where: { categoryId: existing.categoryId, month: m, year: y },
          data: { spent: { decrement: existing.amount } },
        });
      }

      await prisma.transaction.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/transactions/[id] error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
