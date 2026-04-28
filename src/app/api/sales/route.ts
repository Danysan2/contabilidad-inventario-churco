import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendSaleToSheet } from "@/lib/sheets";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const page = parseInt(searchParams.get("page") ?? "1");

  const where = {
    ...(session.user.role === "EMPLOYEE" && { employeeId: session.user.id }),
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
  const { items, note } = body as {
    items: { productId: string; quantity: number; unitPrice: number }[];
    note?: string;
  };

  if (!items?.length) return NextResponse.json({ error: "No hay items" }, { status: 400 });

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
        items: { create: items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })) },
      },
      include: {
        employee: { select: { name: true } },
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

  // Sync to Google Sheets (fire and forget, with logging on failure)
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
