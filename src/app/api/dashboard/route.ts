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
  const period = searchParams.get("period") ?? "week"; // day | week | month

  const now = new Date();
  const from = new Date();
  if (period === "day") from.setHours(0, 0, 0, 0);
  else if (period === "week") from.setDate(now.getDate() - 7);
  else from.setDate(now.getDate() - 30);

  const prevFrom = new Date(from);
  if (period === "day") prevFrom.setDate(prevFrom.getDate() - 1);
  else if (period === "week") prevFrom.setDate(prevFrom.getDate() - 7);
  else prevFrom.setDate(prevFrom.getDate() - 30);

  const [currentSales, prevSales, allActiveProducts, topProducts, recentSales, dailyTotals] = await Promise.all([
    prisma.sale.aggregate({ where: { createdAt: { gte: from } }, _sum: { total: true }, _count: true }),
    prisma.sale.aggregate({ where: { createdAt: { gte: prevFrom, lt: from } }, _sum: { total: true }, _count: true }),
    prisma.product.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: { stock: "asc" },
    }),
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
  ]);

  const lowStockProducts = allActiveProducts.filter((p) => p.stock <= p.minStock).slice(0, 10);

  // Resolve top product names
  const topProductIds = topProducts.map((p) => p.productId);
  const topProductDetails = await prisma.product.findMany({ where: { id: { in: topProductIds } }, select: { id: true, name: true } });
  const topProductMap = Object.fromEntries(topProductDetails.map((p) => [p.id, p.name]));

  const currentTotal = Number(currentSales._sum.total ?? 0);
  const prevTotal = Number(prevSales._sum.total ?? 0);
  const totalChange = prevTotal === 0 ? 100 : ((currentTotal - prevTotal) / prevTotal) * 100;

  return NextResponse.json({
    totalRevenue: currentTotal,
    totalSales: currentSales._count,
    revenueChange: totalChange,
    salesChange: prevSales._count === 0 ? 100 : ((currentSales._count - prevSales._count) / prevSales._count) * 100,
    avgTicket: currentSales._count > 0 ? currentTotal / currentSales._count : 0,
    lowStockProducts,
    topProducts: topProducts.map((p) => ({ productId: p.productId, name: topProductMap[p.productId] ?? "—", quantity: p._sum.quantity ?? 0 })),
    recentSales,
    dailyTotals,
  });
}
