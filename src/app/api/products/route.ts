import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncProductsToSheet } from "@/lib/sheets";
import { productSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const activeOnly = searchParams.get("active") !== "false";
  const branchParam = searchParams.get("branchId");
  const branchId = branchParam && branchParam !== "all" ? branchParam : undefined;

  const products = await prisma.product.findMany({
    where: {
      ...(activeOnly && { active: true }),
      ...(category && category !== "all" && { category: { slug: category } }),
      ...(search && { name: { contains: search, mode: "insensitive" } }),
    },
    include: {
      category: true,
      branchStock: branchId ? { where: { branchId } } : true,
    },
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
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, sku, price, stock, minStock, image, categoryId } = parsed.data;
  const branchId = (body.branchId as string | undefined) || undefined;

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: { name, sku, price, stock: stock ?? 0, minStock: minStock ?? 5, image, categoryId },
      include: { category: true, branchStock: true },
    });

    // Inicializar BranchProduct para todas las sucursales activas
    const branches = await tx.branch.findMany({ where: { active: true }, select: { id: true } });
    for (const branch of branches) {
      const isSelectedBranch = branchId ? branch.id === branchId : false;
      await tx.branchProduct.create({
        data: {
          productId: created.id,
          branchId: branch.id,
          stock: isSelectedBranch ? (stock ?? 0) : 0,
          minStock: minStock ?? 5,
        },
      });
    }

    return created;
  });

  // Sync inventory sheet
  const allProducts = await prisma.product.findMany({ include: { category: true } });
  await syncProductsToSheet(allProducts.map((p) => ({ id: p.id, name: p.name, sku: p.sku, category: p.category.name, price: Number(p.price), stock: p.stock })));

  return NextResponse.json(product, { status: 201 });
}
