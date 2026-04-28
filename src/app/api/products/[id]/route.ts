import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncProductsToSheet } from "@/lib/sheets";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, sku, price, stock, minStock, image, categoryId, active } = body;

  const existing = await prisma.product.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Log stock movement if stock changed
  if (stock !== undefined && stock !== existing.stock) {
    const diff = stock - existing.stock;
    await prisma.stockMovement.create({
      data: {
        productId: params.id,
        type: diff > 0 ? "IN" : "ADJUSTMENT",
        quantity: Math.abs(diff),
        note: "Actualización manual de stock",
      },
    });
  }

  const product = await prisma.product.update({
    where: { id: params.id },
    data: { name, sku, price, stock, minStock, image, categoryId, active },
    include: { category: true },
  });

  const allProducts = await prisma.product.findMany({ include: { category: true } });
  await syncProductsToSheet(allProducts.map((p) => ({ id: p.id, name: p.name, sku: p.sku, category: p.category.name, price: Number(p.price), stock: p.stock })));

  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.product.update({ where: { id: params.id }, data: { active: false } });
  return NextResponse.json({ success: true });
}
