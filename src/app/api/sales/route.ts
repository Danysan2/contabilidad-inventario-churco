import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendSaleToSheet } from "@/lib/sheets";
import { saleSchema, isValidDate } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const rawLimit = parseInt(searchParams.get("limit") ?? "50");
  const rawPage = parseInt(searchParams.get("page") ?? "1");
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 50 : Math.min(rawLimit, 200);
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  if (from && !isValidDate(from)) return NextResponse.json({ error: "Fecha 'from' inválida" }, { status: 400 });
  if (to && !isValidDate(to)) return NextResponse.json({ error: "Fecha 'to' inválida" }, { status: 400 });

  // Branch filter: EMPLOYEE always sees only their branch; ADMIN can filter by branchId param
  const branchParam = searchParams.get("branchId");
  const rawBranchIdGet =
    session.user.role === "EMPLOYEE"
      ? session.user.branchId
      : branchParam && branchParam !== "all"
      ? branchParam
      : undefined;
  const branchId = rawBranchIdGet || undefined;

  const where = {
    ...(branchId && { branchId }),
    ...(from || to
      ? {
          createdAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }
      : {}),
  };

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, slug: true } },
        items: { include: { product: { select: { id: true, name: true, image: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.sale.count({ where }),
  ]);

  return NextResponse.json({ sales, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = saleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const { items, note } = parsed.data;

  // Branch: EMPLOYEE always uses their own branchId; ADMIN uses body.branchId or their own
  const rawBranchId =
    session.user.role === "EMPLOYEE"
      ? session.user.branchId
      : (body.branchId as string | undefined) || session.user.branchId;
  const branchId = rawBranchId || undefined;

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const sale = await prisma.$transaction(async (tx) => {
    // Validate stock before any write
    for (const item of items) {
      const product = await tx.product.findUnique({ where: { id: item.productId }, select: { name: true, stock: true } });
      if (!product) throw new Error(`Producto no encontrado: ${item.productId}`);
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para "${product.name}": disponible ${product.stock}, solicitado ${item.quantity}`);
      }
    }

    const created = await tx.sale.create({
      data: {
        total,
        note,
        employeeId: session.user.id,
        branchId,
        items: { create: items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })) },
      },
      include: {
        employee: { select: { name: true } },
        branch: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: { productId: item.productId, type: "OUT", quantity: item.quantity, note: `Venta ${created.id}` },
      });
    }

    return created;
  });

  // Sync to Google Sheets (fire and forget)
  appendSaleToSheet({
    id: sale.id,
    createdAt: sale.createdAt,
    employeeName: sale.employee.name,
    items: sale.items.map((i) => ({ productName: i.product.name, quantity: i.quantity, unitPrice: Number(i.unitPrice) })),
    total: Number(sale.total),
  })
    .then(() => prisma.sale.update({ where: { id: sale.id }, data: { syncedToSheets: true } }))
    .catch((err) => console.error("[Sheets] Sync failed for sale", sale.id, err));

  return NextResponse.json(sale, { status: 201 });
}
