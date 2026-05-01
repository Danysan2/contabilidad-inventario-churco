import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const expenses = await prisma.fixedExpense.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, amount, categorySlug, description } = await req.json();
  const expense = await prisma.fixedExpense.create({
    data: { name, amount, categorySlug: categorySlug || null, description: description || null },
  });
  return NextResponse.json(expense, { status: 201 });
}
