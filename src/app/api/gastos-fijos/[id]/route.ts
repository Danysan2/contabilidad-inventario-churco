import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, amount, categorySlug, description, active } = await req.json();
  const expense = await prisma.fixedExpense.update({
    where: { id: params.id },
    data: { name, amount, categorySlug: categorySlug || null, description: description || null, active },
  });
  return NextResponse.json(expense);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.fixedExpense.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
