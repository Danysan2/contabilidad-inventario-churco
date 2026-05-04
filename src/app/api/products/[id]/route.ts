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
  const { name, sku, price, stock, minStock, image, categoryId, active, branchId } = body;

  const existing = await prisma.product.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const product = await prisma.$transaction(async (tx) => {
    if (stock !== undefined && branchId) {
      // Ajuste de stock por sucursal específica
      await tx.branchProduct.upsert({
        where: { productId_branchId: { productId: params.id, branchId } },
        update: { stock, ...(minStock !== undefined && { minStock }) },
        create: { productId: params.id, branchId, stock, minStock: minStock ?? 5 },
      });
      // Recalcular stock global como suma de todas las sucursales
      const allBranchStock = await tx.branchProduct.findMany({ where: { productId: params.id } });
      const globalStock = allBranchStock.reduce((s, b) => s + b.stock, 0);
      await tx.stockMovement.create({
        data: {
          productId: params.id,
          type: stock > (existing.stock ?? 0) ? "IN" : "ADJUSTMENT",
          quantity: Math.abs(stock - (existing.stock ?? 0)),
          branchId,
          note: "Actualización manual de stock",
        },
      });
      return tx.product.update({
        where: { id: params.id },
        data: { name, sku, price, stock: globalStock, minStock, image, categoryId, active },
        include: { category: true, branchStock: true },
      });
    }

    // Ajuste global legacy (sin branchId)
    if (stock !== undefined && stock !== existing.stock) {
      const diff = stock - existing.stock;
      await tx.stockMovement.create({
        data: {
          productId: params.id,
          type: diff > 0 ? "IN" : "ADJUSTMENT",
          quantity: Math.abs(diff),
          note: "Actualización manual de stock",
        },
      });
    }
    return tx.product.update({
      where: { id: params.id },
      data: { name, sku, price, stock, minStock, image, categoryId, active },
      include: { category: true, branchStock: true },
    });
  });

  // Fire-and-forget sync with logging on failure
  prisma.product.findMany({ include: { category: true } })
    .then((all) => syncProductsToSheet(all.map((p) => ({ id: p.id, name: p.name, sku: p.sku, category: p.category.name, price: Number(p.price), stock: p.stock }))))
    .catch((err) => console.error("[Sheets] Product sync failed for product", params.id, err));

  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.deleteMany({ where: { productId: params.id } });
    await tx.saleItem.deleteMany({ where: { productId: params.id } });
    await tx.branchProduct.deleteMany({ where: { productId: params.id } });
    await tx.product.delete({ where: { id: params.id } });
  });

  return NextResponse.json({ success: true });
}
