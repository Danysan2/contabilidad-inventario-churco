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

  // Branch filter: EMPLOYEE always sees their branch; ADMIN can filter
  const branchParam = searchParams.get("branchId");
  const branchId =
    session.user.role === "EMPLOYEE"
      ? session.user.branchId
      : branchParam && branchParam !== "all"
      ? branchParam
      : null;

  const rows = await prisma.$queryRawUnsafe<
    { productId: string; totalUnits: bigint; totalRevenue: number }[]
  >(
    `SELECT
      si."productId",
      SUM(si.quantity)::bigint             AS "totalUnits",
      SUM(si.quantity * si."unitPrice")    AS "totalRevenue"
    FROM "SaleItem" si
    JOIN "Sale" s ON si."saleId" = s.id
    WHERE s."createdAt" >= $1
      AND s."createdAt" < $2
      ${branchId ? `AND s."branchId" = $3` : ""}
    GROUP BY si."productId"
    ORDER BY "totalUnits" DESC`,
    from,
    to,
    ...(branchId ? [branchId] : [])
  );

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
