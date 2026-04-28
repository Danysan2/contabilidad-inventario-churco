import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: "bebidas" }, update: {}, create: { name: "Bebidas", slug: "bebidas" } }),
    prisma.category.upsert({ where: { slug: "snacks" }, update: {}, create: { name: "Snacks", slug: "snacks" } }),
    prisma.category.upsert({ where: { slug: "paquetes" }, update: {}, create: { name: "Paquetes", slug: "paquetes" } }),
    prisma.category.upsert({ where: { slug: "cuidado-barba" }, update: {}, create: { name: "Cuidado de Barba", slug: "cuidado-barba" } }),
    prisma.category.upsert({ where: { slug: "cabello" }, update: {}, create: { name: "Cabello", slug: "cabello" } }),
  ]);

  const [bebidas, snacks, paquetes, barba, cabello] = categories;

  // Products
  await prisma.product.upsert({
    where: { sku: "BEV-001" },
    update: {},
    create: { name: "Agua Mineral San Pellegrino", sku: "BEV-001", price: 45.0, stock: 24, minStock: 6, categoryId: bebidas.id },
  });
  await prisma.product.upsert({
    where: { sku: "BEV-002" },
    update: {},
    create: { name: "Cerveza Artesanal IPA", sku: "BEV-002", price: 85.0, stock: 18, minStock: 6, categoryId: bebidas.id },
  });
  await prisma.product.upsert({
    where: { sku: "BEV-003" },
    update: {},
    create: { name: "Bourbon Single Barrel (Shot)", sku: "BEV-003", price: 15.0, stock: 24, minStock: 5, categoryId: bebidas.id },
  });
  await prisma.product.upsert({
    where: { sku: "BEV-004" },
    update: {},
    create: { name: "Espresso Doble", sku: "BEV-004", price: 55.0, stock: 30, minStock: 10, categoryId: bebidas.id },
  });
  await prisma.product.upsert({
    where: { sku: "SNK-001" },
    update: {},
    create: { name: "Papas Fritas Premium", sku: "SNK-001", price: 35.0, stock: 20, minStock: 5, categoryId: snacks.id },
  });
  await prisma.product.upsert({
    where: { sku: "SNK-002" },
    update: {},
    create: { name: "Maní Tostado con Sal", sku: "SNK-002", price: 25.0, stock: 4, minStock: 5, categoryId: snacks.id },
  });
  await prisma.product.upsert({
    where: { sku: "PKG-001" },
    update: {},
    create: { name: "Combo Corte + Bebida", sku: "PKG-001", price: 120.0, stock: 50, minStock: 0, categoryId: paquetes.id },
  });
  await prisma.product.upsert({
    where: { sku: "BRD-001" },
    update: {},
    create: { name: "Aceite Signature Reserve", sku: "BRD-001", price: 35.0, stock: 45, minStock: 5, categoryId: barba.id },
  });
  await prisma.product.upsert({
    where: { sku: "HR-012" },
    update: {},
    create: { name: "Pomada Texturizante Mate", sku: "HR-012", price: 22.5, stock: 4, minStock: 5, categoryId: cabello.id },
  });

  // Admin user
  const hashedAdmin = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@groomandgold.com" },
    update: {},
    create: { name: "Master Barber", email: "admin@groomandgold.com", password: hashedAdmin, role: "ADMIN" },
  });

  // Employee user
  const hashedEmployee = await bcrypt.hash("empleado123", 10);
  await prisma.user.upsert({
    where: { email: "empleado@groomandgold.com" },
    update: {},
    create: { name: "Carlos Barber", email: "empleado@groomandgold.com", password: hashedEmployee, role: "EMPLOYEE" },
  });

  console.log("✅ Seed completado — Groom & Gold");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
