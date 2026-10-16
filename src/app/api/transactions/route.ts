// API: /api/transactions
// CRUD transaksi dengan auto-update saldo rekening
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/transactions?month=&year=&type=&accountId=&categoryId=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const type = searchParams.get("type");
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");
    const limit = searchParams.get("limit");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {};
    if (type) where.type = type;
    if (accountId) where.accountId = accountId;
    if (categoryId) where.categoryId = categoryId;

    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const end = new Date(y, m, 1, 0, 0, 0, 0);
      where.date = { gte: start, lt: end };
    } else if (from && to) {
      where.date = {
        gte: new Date(from + "T00:00:00"),
        lt: new Date(to + "T23:59:59"),
      };
    }

    const transactions = await db.transaction.findMany({
      where,
      include: {
        user: true,
        account: true,
        category: true,
        toAccount: true,
      },
      orderBy: { date: "desc" },
      ...(limit ? { take: parseInt(limit, 10) } : {}),
    });

    return NextResponse.json({ data: transactions });
  } catch (e: any) {
    console.error("GET /api/transactions error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/transactions
// Buat transaksi baru. Jika type=TRANSFER, accountId & toAccountId wajib.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, type, amount, note, userId, accountId, categoryId, toAccountId } = body;

    if (!date || !type || !amount || !userId || !accountId) {
      return NextResponse.json(
        { error: "Field wajib: date, type, amount, userId, accountId" },
        { status: 400 }
      );
    }
    if (amount <= 0) {
      return NextResponse.json({ error: "Nominal harus > 0" }, { status: 400 });
    }
    if (type === "TRANSFER" && !toAccountId) {
      return NextResponse.json(
        { error: "Transfer wajib ada rekening tujuan" },
        { status: 400 }
      );
    }
    if (type === "TRANSFER" && accountId === toAccountId) {
      return NextResponse.json(
        { error: "Rekening sumber & tujuan tidak boleh sama" },
        { status: 400 }
      );
    }
    if ((type === "INCOME" || type === "EXPENSE") && !categoryId) {
      return NextResponse.json(
        { error: "Pemasukan/pengeluaran wajib ada kategori" },
        { status: 400 }
      );
    }

    // Gunakan transaksi Prisma untuk konsistensi saldo
    const tx = await db.$transaction(async (prisma) => {
      // Buat catatan transaksi
      const newTx = await prisma.transaction.create({
        data: {
          date: new Date(date + "T00:00:00"),
          type,
          amount: Math.round(amount),
          note: note ?? null,
          userId,
          accountId,
          categoryId: type === "TRANSFER" ? null : categoryId,
          toAccountId: type === "TRANSFER" ? toAccountId : null,
        },
        include: {
          user: true,
          account: true,
          category: true,
          toAccount: true,
        },
      });

      // Auto-update saldo rekening
      const acc = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
      if (type === "INCOME") {
        await prisma.account.update({
          where: { id: accountId },
          data: { balance: acc.balance + Math.round(amount) },
        });
      } else if (type === "EXPENSE") {
        await prisma.account.update({
          where: { id: accountId },
          data: { balance: acc.balance - Math.round(amount) },
        });
      } else if (type === "TRANSFER") {
        const toAcc = await prisma.account.findUniqueOrThrow({ where: { id: toAccountId } });
        await prisma.account.update({
          where: { id: accountId },
          data: { balance: acc.balance - Math.round(amount) },
        });
        await prisma.account.update({
          where: { id: toAccountId },
          data: { balance: toAcc.balance + Math.round(amount) },
        });
      }

      // Update anggaran (spent) jika ada kategori & bulan berjalan
      if (type === "EXPENSE" && categoryId) {
        const txDate = new Date(date + "T00:00:00");
        const m = txDate.getMonth() + 1;
        const y = txDate.getFullYear();
        await prisma.budget.updateMany({
          where: { categoryId, month: m, year: y },
          data: { spent: { increment: Math.round(amount) } },
        });
      }

      return newTx;
    });

    return NextResponse.json({ data: tx }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/transactions error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
