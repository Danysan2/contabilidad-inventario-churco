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

  const branchParam = searchParams.get("branchId");
  const isEmployee = session.user.role === "EMPLOYEE";
  const branchId = isEmployee
    ? undefined
    : branchParam && branchParam !== "all" ? branchParam : undefined;

  const where = {
    ...(isEmployee && { employeeId: session.user.id }),
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
  const reqId = Math.random().toString(36).slice(2, 8).toUpperCase();
  console.log(`[SALE:${reqId}] ── POST /api/sales iniciado`);

  const session = await getServerSession(authOptions);
  if (!session) {
    console.log(`[SALE:${reqId}] ✗ Sin sesión — 401`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log(`[SALE:${reqId}] Sesión: user=${session.user.name} role=${session.user.role} branchId=${session.user.branchId || "(vacío)"}`);

  let body: unknown;
  try {
    body = await req.json();
  } catch (e) {
    console.log(`[SALE:${reqId}] ✗ Body inválido (no es JSON):`, e);
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
  console.log(`[SALE:${reqId}] Body recibido:`, JSON.stringify(body));

  const parsed = saleSchema.safeParse(body);
  if (!parsed.success) {
    console.log(`[SALE:${reqId}] ✗ Validación fallida:`, JSON.stringify(parsed.error.flatten()));
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const { items, note } = parsed.data;
  console.log(`[SALE:${reqId}] Validación OK — ${items.length} ítem(s), nota="${note ?? ""}"`);

  const rawBranchId =
    session.user.role === "EMPLOYEE"
      ? session.user.branchId
      : ((body as Record<string, unknown>).branchId as string | undefined) || session.user.branchId;
  const branchId = rawBranchId || undefined;
  console.log(`[SALE:${reqId}] branchId resuelto: ${branchId ?? "(null — sin sucursal)"}`);

  // Verify branchId exists if provided
  if (branchId) {
    const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { id: true, name: true } });
    if (!branch) {
      console.log(`[SALE:${reqId}] ✗ branchId "${branchId}" no existe en la base de datos`);
      return NextResponse.json({ error: `Sucursal no encontrada: ${branchId}` }, { status: 400 });
    }
    console.log(`[SALE:${reqId}] Branch verificada: "${branch.name}"`);
  }

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  console.log(`[SALE:${reqId}] Total calculado: ${total}`);

  let sale;
  try {
    sale = await prisma.$transaction(async (tx) => {
      console.log(`[SALE:${reqId}] Iniciando transacción...`);

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId }, select: { name: true, stock: true } });
        if (!product) {
          console.log(`[SALE:${reqId}] ✗ Producto no encontrado: ${item.productId}`);
          throw new Error(`Producto no encontrado: ${item.productId}`);
        }
        console.log(`[SALE:${reqId}] Stock "${product.name}": disponible=${product.stock}, solicitado=${item.quantity}`);
        if (product.stock < item.quantity) {
          console.log(`[SALE:${reqId}] ✗ Stock insuficiente para "${product.name}"`);
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
      console.log(`[SALE:${reqId}] Sale creada id=${created.id} branch="${created.branch?.name ?? "ninguna"}"`);

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: { productId: item.productId, type: "OUT", quantity: item.quantity, note: `Venta ${created.id}` },
        });
      }
      console.log(`[SALE:${reqId}] Stock decrementado y movimientos creados`);

      return created;
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[SALE:${reqId}] ✗ Error en transacción:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  console.log(`[SALE:${reqId}] ✓ Venta registrada exitosamente id=${sale.id}`);

  appendSaleToSheet({
    id: sale.id,
    createdAt: sale.createdAt,
    employeeName: sale.employee.name,
    items: sale.items.map((i) => ({ productName: i.product.name, quantity: i.quantity, unitPrice: Number(i.unitPrice) })),
    total: Number(sale.total),
  })
    .then(() => {
      console.log(`[SALE:${reqId}] Sheets sync OK`);
      return prisma.sale.update({ where: { id: sale.id }, data: { syncedToSheets: true } });
    })
    .catch((err) => console.error(`[SALE:${reqId}] Sheets sync FAILED:`, err));

  return NextResponse.json(sale, { status: 201 });
}
