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
  const branchParam = searchParams.get("branchId");
  const branchId = branchParam && branchParam !== "all" ? branchParam : null;

  const now = new Date();
  const from = new Date();
  if (period === "day") from.setHours(0, 0, 0, 0);
  else if (period === "week") from.setDate(now.getDate() - 7);
  else from.setDate(now.getDate() - 30);

  const prevFrom = new Date(from);
  if (period === "day") prevFrom.setDate(prevFrom.getDate() - 1);
  else if (period === "week") prevFrom.setDate(prevFrom.getDate() - 7);
  else prevFrom.setDate(prevFrom.getDate() - 30);

  const saleWhere = {
    createdAt: { gte: from },
    ...(branchId ? { branchId } : {}),
  };
  const prevSaleWhere = {
    createdAt: { gte: prevFrom, lt: from },
    ...(branchId ? { branchId } : {}),
  };

  // Build daily/hourly SQL with optional branch filter
  const branchClause = branchId ? `AND "branchId" = '${branchId}'` : "";

  const [
    currentSales, prevSales, allActiveProducts,
    topProducts, recentSales, dailyTotals,
    saleItemsWithCost, fixedExpenses, categoryRevenue,
    branchRevenue, dailyPurchases,
  ] = await Promise.all([
    prisma.sale.aggregate({ where: saleWhere, _sum: { total: true }, _count: true }),
    prisma.sale.aggregate({ where: prevSaleWhere, _sum: { total: true }, _count: true }),
    prisma.product.findMany({ where: { active: true }, include: { category: true }, orderBy: { stock: "asc" } }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: saleWhere },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.sale.findMany({
      where: saleWhere,
      include: {
        employee: { select: { name: true } },
        branch: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    period === "day"
      ? prisma.$queryRawUnsafe<{ date: string; total: number }[]>(
          `SELECT DATE_TRUNC('hour', "createdAt") as date, SUM(total) as total
           FROM "Sale"
           WHERE "createdAt" >= $1 ${branchClause}
           GROUP BY DATE_TRUNC('hour', "createdAt")
           ORDER BY date ASC`,
          from
        )
      : prisma.$queryRawUnsafe<{ date: string; total: number }[]>(
          `SELECT DATE("createdAt") as date, SUM(total) as total
           FROM "Sale"
           WHERE "createdAt" >= $1 ${branchClause}
           GROUP BY DATE("createdAt")
           ORDER BY date ASC`,
          from
        ),
    prisma.saleItem.findMany({
      where: { sale: saleWhere },
      include: { product: { select: { costPrice: true } } },
    }),
    // Fixed expenses: no branch filter for margin calc (global overhead)
    prisma.fixedExpense.findMany({ where: { active: true, ...(branchId ? { branchId } : {}) } }),
    // Revenue by category
    prisma.$queryRawUnsafe<{ slug: string; name: string; revenue: number }[]>(
      `SELECT c.slug, c.name, COALESCE(SUM(si.quantity * si."unitPrice"), 0) as revenue
       FROM "Category" c
       LEFT JOIN "Product" p ON p."categoryId" = c.id
       LEFT JOIN "SaleItem" si ON si."productId" = p.id
       LEFT JOIN "Sale" s ON si."saleId" = s.id AND s."createdAt" >= $1 ${branchClause}
       GROUP BY c.slug, c.name
       ORDER BY revenue DESC`,
      from
    ),
    // Revenue per branch for the period
    prisma.sale.groupBy({
      by: ["branchId"],
      where: { createdAt: { gte: from } },
      _sum: { total: true },
    }),
    // Daily purchase totals (for egresos line in main chart)
    period === "day"
      ? prisma.$queryRawUnsafe<{ date: string; total: number }[]>(
          `SELECT DATE_TRUNC('hour', "date") as date, SUM(pi.quantity * pi."unitCost") as total
           FROM "Purchase" pu
           JOIN "PurchaseItem" pi ON pi."purchaseId" = pu.id
           WHERE pu."date" >= $1 ${branchId ? `AND pu."branchId" = '${branchId}'` : ""}
           GROUP BY DATE_TRUNC('hour', pu."date")
           ORDER BY date ASC`,
          from
        )
      : prisma.$queryRawUnsafe<{ date: string; total: number }[]>(
          `SELECT DATE(pu."date") as date, SUM(pi.quantity * pi."unitCost") as total
           FROM "Purchase" pu
           JOIN "PurchaseItem" pi ON pi."purchaseId" = pu.id
           WHERE pu."date" >= $1 ${branchId ? `AND pu."branchId" = '${branchId}'` : ""}
           GROUP BY DATE(pu."date")
           ORDER BY date ASC`,
          from
        ),
  ]);

  const lowStockProducts = allActiveProducts.filter((p) => p.stock <= p.minStock).slice(0, 10);

  const topProductIds = topProducts.map((p) => p.productId);
  const topProductDetails = await prisma.product.findMany({ where: { id: { in: topProductIds } }, select: { id: true, name: true } });
  const topProductMap = Object.fromEntries(topProductDetails.map((p) => [p.id, p.name]));

  // Enrich branchRevenue with branch names
  const branchIds = branchRevenue.map((b) => b.branchId).filter((id): id is string => id !== null);
  const branches = await prisma.branch.findMany({ where: { id: { in: branchIds } }, select: { id: true, name: true } });
  const branchNameMap = Object.fromEntries(branches.map((b) => [b.id, b.name]));
  const branchRevenueNamed = branchRevenue.map((b) => ({
    branchId: b.branchId ?? "",
    name: b.branchId ? (branchNameMap[b.branchId] ?? b.branchId) : "Sin sucursal",
    revenue: Number(b._sum.total ?? 0),
  }));

  const currentTotal = Number(currentSales._sum.total ?? 0);
  const prevTotal = Number(prevSales._sum.total ?? 0);
  const totalChange = prevTotal === 0 ? 100 : ((currentTotal - prevTotal) / prevTotal) * 100;

  const cogs = saleItemsWithCost.reduce((sum, item) => {
    if (!item.product.costPrice) return sum;
    return sum + Number(item.product.costPrice) * item.quantity;
  }, 0);
  const grossMargin = currentTotal - cogs;
  const grossMarginPct = currentTotal > 0 ? (grossMargin / currentTotal) * 100 : 0;

  const totalMonthlyFixed = fixedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const proratedFixed =
    period === "day" ? totalMonthlyFixed / 30 :
    period === "week" ? totalMonthlyFixed * 7 / 30 :
    totalMonthlyFixed;
  const netMargin = grossMargin - proratedFixed;
  const netMarginPct = currentTotal > 0 ? (netMargin / currentTotal) * 100 : 0;

  const categoryGroupMap: Record<string, string> = {
    bebidas: "Bebidas", belleza: "Belleza", comida: "Comida",
    snacks: "Comida", cabello: "Belleza", "cuidado-barba": "Belleza", paquetes: "Comida",
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
    dailyExpenses: dailyPurchases,
    salesByGroup,
    branchRevenue: branchRevenueNamed,
  });
}
