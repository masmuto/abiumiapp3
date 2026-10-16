// API: /api/seed
// Re-seed dari UI: gunakan untuk reset data awal (jika belum ada)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_CATEGORIES, DEFAULT_USERS } from "@/lib/constants";

export async function POST() {
  try {
    let created = { users: 0, categories: 0, accounts: 0, assets: 0 };

    for (const u of DEFAULT_USERS) {
      const exists = await db.user.findUnique({ where: { name: u.name } });
      if (!exists) {
        await db.user.create({ data: { ...u } });
        created.users++;
      }
    }

    for (const cat of DEFAULT_CATEGORIES) {
      const exists = await db.category.findFirst({
        where: { name: cat.name, type: cat.type },
      });
      if (!exists) {
        await db.category.create({
          data: { ...cat, isDefault: true },
        });
        created.categories++;
      }
    }

    const acCount = await db.account.count();
    if (acCount === 0) {
      await db.account.createMany({
        data: [
          { name: "Tunai Dompet", type: "CASH", initialBalance: 500000, balance: 500000, icon: "💵" },
          { name: "Bank BCA", type: "BANK", initialBalance: 5000000, balance: 5000000, icon: "🏦" },
          { name: "GoPay", type: "EWALLET", initialBalance: 250000, balance: 250000, icon: "📱" },
          { name: "Tabungan Keluarga", type: "SAVINGS", initialBalance: 10000000, balance: 10000000, icon: "🐷" },
          { name: "Lemari Emas", type: "GOLD", initialBalance: 0, balance: 0, icon: "🪙" },
        ],
      });
      created.accounts = 5;
    }

    const asCount = await db.asset.count();
    if (asCount === 0) {
      await db.asset.createMany({
        data: [
          { name: "Emas Antam 10gr", type: "GOLD", quantity: 10, unitPrice: 1800000, value: 18000000 },
          { name: "Dinar 1 keping", type: "DINAR", quantity: 1, unitPrice: 3500000, value: 3500000 },
        ],
      });
      created.assets = 2;
    }

    return NextResponse.json({ data: created });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
