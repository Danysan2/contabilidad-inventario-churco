import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const corte = await prisma.corte.findUnique({ where: { id: params.id } });
  if (!corte) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && corte.employeeId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.corte.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
