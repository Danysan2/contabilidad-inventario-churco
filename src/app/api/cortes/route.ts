import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const employeeIdParam = searchParams.get("employeeId");

  const isAdmin = session.user.role === "ADMIN";

  const from = fromParam ? new Date(fromParam) : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  const to = toParam ? new Date(toParam) : new Date();

  const where = {
    createdAt: { gte: from, lte: to },
    ...(isAdmin
      ? employeeIdParam ? { employeeId: employeeIdParam } : {}
      : { employeeId: session.user.id }),
  };

  const cortes = await prisma.corte.findMany({
    where,
    include: {
      employee: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const enriched = cortes.map((c) => ({
    ...c,
    price: Number(c.price),
    ownerPct: Number(c.ownerPct),
    ownerAmount: Number(c.price) * Number(c.ownerPct) / 100,
    employeeAmount: Number(c.price) * (1 - Number(c.ownerPct) / 100),
  }));

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const price = parseFloat(body.price);
  const ownerPct = parseFloat(body.ownerPct);
  const note: string | undefined = body.note || undefined;

  if (!price || price <= 0) return NextResponse.json({ error: "El valor del corte debe ser mayor a 0" }, { status: 400 });
  if (isNaN(ownerPct) || ownerPct < 0 || ownerPct > 100) return NextResponse.json({ error: "El porcentaje debe estar entre 0 y 100" }, { status: 400 });

  const isAdmin = session.user.role === "ADMIN";
  const branchId = isAdmin ? (body.branchId || session.user.branchId || undefined) : (session.user.branchId || undefined);

  const corte = await prisma.corte.create({
    data: {
      employeeId: session.user.id,
      branchId,
      price,
      ownerPct,
      note,
    },
    include: {
      employee: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    ...corte,
    price: Number(corte.price),
    ownerPct: Number(corte.ownerPct),
    ownerAmount: Number(corte.price) * Number(corte.ownerPct) / 100,
    employeeAmount: Number(corte.price) * (1 - Number(corte.ownerPct) / 100),
  }, { status: 201 });
}
