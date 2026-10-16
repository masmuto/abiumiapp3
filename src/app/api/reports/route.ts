// API: /api/reports?month=&year=
// Ringkasan real-time: total pemasukan, pengeluaran, surplus, saldo, aset, kewajiban, kekayaan bersih
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const accountId = searchParams.get("accountId");

    const now = new Date();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 1, 0, 0, 0, 0);

    const whereTxBase: any = { date: { gte: start, lt: end } };
    if (accountId) {
      whereTxBase.OR = [
        { accountId },
        { toAccountId: accountId },
      ];
    }

    // Aggregate income
    const incomeAgg = await db.transaction.aggregate({
      where: { ...whereTxBase, type: "INCOME" },
      _sum: { amount: true },
      _count: true,
    });
    const expenseAgg = await db.transaction.aggregate({
      where: { ...whereTxBase, type: "EXPENSE" },
      _sum: { amount: true },
      _count: true,
    });
    const transferAgg = await db.transaction.aggregate({
      where: { ...whereTxBase, type: "TRANSFER" },
      _sum: { amount: true },
      _count: true,
    });

    // Saldo semua rekening (jika tanpa accountId filter)
    const accounts = await db.account.findMany({
      where: { archived: false },
    });
    const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

    // Aset
    const assets = await db.asset.findMany();
    const totalAssets = assets.reduce((s, a) => s + a.value, 0);

    // Kewajiban
    const liabilities = await db.liability.findMany({ where: { settled: false } });
    const totalLiabilities = liabilities.reduce((s, l) => s + l.amount, 0);

    const netWorth = totalBalance + totalAssets - totalLiabilities;

    // Breakdown per kategori (untuk grafik pengeluaran)
    const expenseByCategory = await db.transaction.groupBy({
      by: ["categoryId"],
      where: { ...whereTxBase, type: "EXPENSE" },
      _sum: { amount: true },
    });
    const categories = await db.category.findMany();
    const breakdown = expenseByCategory
      .map((b) => {
        const cat = categories.find((c) => c.id === b.categoryId);
        return {
          categoryId: b.categoryId,
          name: cat?.name ?? "Tanpa kategori",
          icon: cat?.icon ?? "📦",
          color: cat?.color ?? "slate",
          total: b._sum.amount ?? 0,
        };
      })
      .filter((b) => b.total > 0)
      .sort((a, b) => b.total - a.total);

    // Breakdown per hari (untuk grafik tren)
    const dailyTx = await db.transaction.findMany({
      where: whereTxBase,
      select: { date: true, type: true, amount: true },
    });
    const dailyMap: Record<string, { income: number; expense: number }> = {};
    for (const t of dailyTx) {
      const key = `${t.date.getDate()}`;
      if (!dailyMap[key]) dailyMap[key] = { income: 0, expense: 0 };
      if (t.type === "INCOME") dailyMap[key].income += t.amount;
      else if (t.type === "EXPENSE") dailyMap[key].expense += t.amount;
    }
    const daysInMonth = new Date(year, month, 0).getDate();
    const daily = Array.from({ length: daysInMonth }, (_, i) => {
      const key = `${i + 1}`;
      return { day: i + 1, ...dailyMap[key] };
    });

    // Per rekening (untuk tampilan)
    const accountsWithTx = await Promise.all(
      accounts.map(async (a) => {
        const inc = await db.transaction.aggregate({
          where: { accountId: a.id, type: "INCOME", date: { gte: start, lt: end } },
          _sum: { amount: true },
        });
        const exp = await db.transaction.aggregate({
          where: { accountId: a.id, type: "EXPENSE", date: { gte: start, lt: end } },
          _sum: { amount: true },
        });
        return {
          ...a,
          income: inc._sum.amount ?? 0,
          expense: exp._sum.amount ?? 0,
        };
      })
    );

    return NextResponse.json({
      data: {
        period: { month, year },
        summary: {
          income: incomeAgg._sum.amount ?? 0,
          expense: expenseAgg._sum.amount ?? 0,
          transfer: transferAgg._sum.amount ?? 0,
          incomeCount: incomeAgg._count,
          expenseCount: expenseAgg._count,
          transferCount: transferAgg._count,
          surplus: (incomeAgg._sum.amount ?? 0) - (expenseAgg._sum.amount ?? 0),
        },
        accounts: accountsWithTx,
        totalBalance,
        totalAssets,
        totalLiabilities,
        netWorth,
        breakdown,
        daily,
        assets,
        liabilities,
      },
    });
  } catch (e: any) {
    console.error("GET /api/reports error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
