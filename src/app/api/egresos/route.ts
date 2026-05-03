import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { purchaseSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const branchParam = searchParams.get("branchId");
  const branchId = branchParam && branchParam !== "all" ? branchParam : undefined;

  const where = branchId ? { branchId } : {};

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        branch: { select: { id: true, name: true, slug: true } },
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
      },
    }),
    prisma.purchase.count({ where }),
  ]);

  return NextResponse.json({ purchases, total });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const { note, items } = parsed.data;
  const branchId = (body.branchId as string | undefined) || session.user.branchId;

  const purchase = await prisma.$transaction(async (tx) => {
    const created = await tx.purchase.create({
      data: {
        note,
        branchId,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitCost: i.unitCost,
          })),
        },
      },
      include: { items: { include: { product: { select: { id: true, name: true } } } } },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          costPrice: item.unitCost,
        },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "IN",
          quantity: item.quantity,
          note: `Compra registrada${note ? `: ${note}` : ""}`,
        },
      });
    }

    return created;
  });

  return NextResponse.json(purchase, { status: 201 });
}
