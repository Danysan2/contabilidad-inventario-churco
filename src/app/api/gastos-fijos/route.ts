import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fixedExpenseSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const branchParam = searchParams.get("branchId");
  const branchId = branchParam && branchParam !== "all" ? branchParam : undefined;

  const expenses = await prisma.fixedExpense.findMany({
    where: branchId ? { branchId } : {},
    include: { branch: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = fixedExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, amount, categorySlug, description } = parsed.data;
  const branchId = (body.branchId as string | undefined) || session.user.branchId;

  const expense = await prisma.fixedExpense.create({
    data: { name, amount, categorySlug: categorySlug || null, description: description || null, branchId },
  });
  return NextResponse.json(expense, { status: 201 });
}
