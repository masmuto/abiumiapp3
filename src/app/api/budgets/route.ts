// API: /api/budgets
// Anggaran bulanan per kategori
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: any = {};
    if (month) where.month = parseInt(month, 10);
    if (year) where.year = parseInt(year, 10);

    const budgets = await db.budget.findMany({
      where,
      include: { category: true, user: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    return NextResponse.json({ data: budgets });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { month, year, amount, categoryId, userId } = body;
    if (!month || !year || !amount || !categoryId || !userId) {
      return NextResponse.json(
        { error: "Bulan, tahun, nominal, kategori & user wajib" },
        { status: 400 }
      );
    }

    // upsert by unique (month, year, categoryId)
    const existing = await db.budget.findFirst({
      where: { month, year, categoryId },
    });
    let budget;
    if (existing) {
      budget = await db.budget.update({
        where: { id: existing.id },
        data: { amount: Math.round(amount), userId },
        include: { category: true, user: true },
      });
    } else {
      budget = await db.budget.create({
        data: {
          month,
          year,
          amount: Math.round(amount),
          categoryId,
          userId,
        },
        include: { category: true, user: true },
      });
    }

    // Recalculate spent berdasarkan transaksi bulan ini
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 1, 0, 0, 0, 0);
    const agg = await db.transaction.aggregate({
      where: {
        categoryId,
        type: "EXPENSE",
        date: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });
    const spent = agg._sum.amount ?? 0;
    budget = await db.budget.update({
      where: { id: budget.id },
      data: { spent },
      include: { category: true, user: true },
    });

    return NextResponse.json({ data: budget }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
