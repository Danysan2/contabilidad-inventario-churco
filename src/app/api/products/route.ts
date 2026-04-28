import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncProductsToSheet } from "@/lib/sheets";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const activeOnly = searchParams.get("active") !== "false";

  const products = await prisma.product.findMany({
    where: {
      ...(activeOnly && { active: true }),
      ...(category && category !== "all" && { category: { slug: category } }),
      ...(search && { name: { contains: search, mode: "insensitive" } }),
    },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, sku, price, stock, minStock, image, categoryId } = body;

  if (!name || !sku || !price || !categoryId) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: { name, sku, price, stock: stock ?? 0, minStock: minStock ?? 5, image, categoryId },
    include: { category: true },
  });

  // Sync inventory sheet
  const allProducts = await prisma.product.findMany({ include: { category: true } });
  await syncProductsToSheet(allProducts.map((p) => ({ id: p.id, name: p.name, sku: p.sku, category: p.category.name, price: Number(p.price), stock: p.stock })));

  return NextResponse.json(product, { status: 201 });
}
