import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "week";

  const now = new Date();
  const from = new Date();
  if (period === "day") from.setHours(0, 0, 0, 0);
  else if (period === "week") from.setDate(now.getDate() - 7);
  else from.setDate(now.getDate() - 30);

  const prevFrom = new Date(from);
  if (period === "day") prevFrom.setDate(prevFrom.getDate() - 1);
  else if (period === "week") prevFrom.setDate(prevFrom.getDate() - 7);
  else prevFrom.setDate(prevFrom.getDate() - 30);

  const [
    currentSales, prevSales, allActiveProducts,
    topProducts, recentSales, dailyTotals,
    saleItemsWithCost, fixedExpenses, categoryRevenue,
  ] = await Promise.all([
    prisma.sale.aggregate({ where: { createdAt: { gte: from } }, _sum: { total: true }, _count: true }),
    prisma.sale.aggregate({ where: { createdAt: { gte: prevFrom, lt: from } }, _sum: { total: true }, _count: true }),
    prisma.product.findMany({ where: { active: true }, include: { category: true }, orderBy: { stock: "asc" } }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { createdAt: { gte: from } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.sale.findMany({
      where: { createdAt: { gte: from } },
      include: { employee: { select: { name: true } }, items: { include: { product: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.$queryRaw<{ date: string; total: number }[]>`
      SELECT DATE("createdAt") as date, SUM(total) as total
      FROM "Sale"
      WHERE "createdAt" >= ${from}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
    // For margin calculation: sale items with product cost price
    prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: from } } },
      include: { product: { select: { costPrice: true } } },
    }),
    // Fixed expenses (monthly amounts, will prorate)
    prisma.fixedExpense.findMany({ where: { active: true } }),
    // Revenue by category
    prisma.$queryRaw<{ slug: string; name: string; revenue: number }[]>`
      SELECT c.slug, c.name, COALESCE(SUM(si.quantity * si."unitPrice"), 0) as revenue
      FROM "Category" c
      LEFT JOIN "Product" p ON p."categoryId" = c.id
      LEFT JOIN "SaleItem" si ON si."productId" = p.id
      LEFT JOIN "Sale" s ON si."saleId" = s.id AND s."createdAt" >= ${from}
      GROUP BY c.slug, c.name
      ORDER BY revenue DESC
    `,
  ]);

  const lowStockProducts = allActiveProducts.filter((p) => p.stock <= p.minStock).slice(0, 10);

  const topProductIds = topProducts.map((p) => p.productId);
  const topProductDetails = await prisma.product.findMany({ where: { id: { in: topProductIds } }, select: { id: true, name: true } });
  const topProductMap = Object.fromEntries(topProductDetails.map((p) => [p.id, p.name]));

  const currentTotal = Number(currentSales._sum.total ?? 0);
  const prevTotal = Number(prevSales._sum.total ?? 0);
  const totalChange = prevTotal === 0 ? 100 : ((currentTotal - prevTotal) / prevTotal) * 100;

  // Gross margin = revenue - COGS (only items where costPrice is known)
  const cogs = saleItemsWithCost.reduce((sum, item) => {
    if (!item.product.costPrice) return sum;
    return sum + Number(item.product.costPrice) * item.quantity;
  }, 0);
  const grossMargin = currentTotal - cogs;
  const grossMarginPct = currentTotal > 0 ? (grossMargin / currentTotal) * 100 : 0;

  // Net margin = gross margin - prorated fixed expenses
  const totalMonthlyFixed = fixedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const proratedFixed =
    period === "day" ? totalMonthlyFixed / 30 :
    period === "week" ? totalMonthlyFixed * 7 / 30 :
    totalMonthlyFixed;
  const netMargin = grossMargin - proratedFixed;
  const netMarginPct = currentTotal > 0 ? (netMargin / currentTotal) * 100 : 0;

  // Group categories: bebidas→Refrescos, snacks→Comida, cabello+cuidado-barba→Belleza, rest→Otros
  const categoryGroupMap: Record<string, string> = {
    bebidas: "Refrescos",
    snacks: "Comida",
    cabello: "Belleza",
    "cuidado-barba": "Belleza",
    paquetes: "Servicios",
  };
  const groupedRevenue: Record<string, number> = {};
  for (const row of categoryRevenue) {
    const group = categoryGroupMap[row.slug] ?? "Otros";
    groupedRevenue[group] = (groupedRevenue[group] ?? 0) + Number(row.revenue);
  }
  const salesByGroup = Object.entries(groupedRevenue)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  return NextResponse.json({
    totalRevenue: currentTotal,
    totalSales: currentSales._count,
    revenueChange: totalChange,
    salesChange: prevSales._count === 0 ? 100 : ((currentSales._count - prevSales._count) / prevSales._count) * 100,
    avgTicket: currentSales._count > 0 ? currentTotal / currentSales._count : 0,
    grossMargin,
    grossMarginPct,
    netMargin,
    netMarginPct,
    cogs,
    proratedFixed,
    lowStockProducts,
    topProducts: topProducts.map((p) => ({ productId: p.productId, name: topProductMap[p.productId] ?? "—", quantity: p._sum.quantity ?? 0 })),
    recentSales,
    dailyTotals,
    salesByGroup,
  });
}
