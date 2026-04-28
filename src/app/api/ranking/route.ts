import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));

  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);

  // Raw query: sum units and revenue per product for the period
  const rows = await prisma.$queryRaw<
    { productId: string; totalUnits: bigint; totalRevenue: number }[]
  >`
    SELECT
      si."productId",
      SUM(si.quantity)::bigint             AS "totalUnits",
      SUM(si.quantity * si."unitPrice")    AS "totalRevenue"
    FROM "SaleItem" si
    JOIN "Sale" s ON si."saleId" = s.id
    WHERE s."createdAt" >= ${from}
      AND s."createdAt" < ${to}
    GROUP BY si."productId"
    ORDER BY "totalUnits" DESC
  `;

  if (!rows.length) {
    return NextResponse.json({ ranking: [], year, month, from: from.toISOString(), to: to.toISOString() });
  }

  const productIds = rows.map((r) => r.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, image: true, category: { select: { name: true } } },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const ranking = rows.map((r, i) => ({
    rank: i + 1,
    product: productMap[r.productId] ?? { id: r.productId, name: "Producto eliminado", image: null, category: { name: "—" } },
    totalUnits: Number(r.totalUnits),
    totalRevenue: Number(r.totalRevenue),
  }));

  return NextResponse.json({ ranking, year, month, from: from.toISOString(), to: to.toISOString() });
}
