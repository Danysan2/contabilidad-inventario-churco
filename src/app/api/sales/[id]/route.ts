import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { note } = body;

  const sale = await prisma.sale.update({
    where: { id: params.id },
    data: { note },
    include: {
      employee: { select: { name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  });

  return NextResponse.json(sale);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Restore stock
  const sale = await prisma.sale.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
    }
    await tx.sale.delete({ where: { id: params.id } });
  });

  return NextResponse.json({ success: true });
}
