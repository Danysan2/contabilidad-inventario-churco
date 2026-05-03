import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Categories ──────────────────────────────────────────────────────────────
  const [bebidas, belleza, comida] = await Promise.all([
    prisma.category.upsert({ where: { slug: "bebidas" }, update: { name: "Bebidas" }, create: { name: "Bebidas", slug: "bebidas" } }),
    prisma.category.upsert({ where: { slug: "belleza" }, update: { name: "Belleza" }, create: { name: "Belleza", slug: "belleza" } }),
    prisma.category.upsert({ where: { slug: "comida"  }, update: { name: "Comida"  }, create: { name: "Comida",  slug: "comida"  } }),
  ]);

  // ── Migrate existing products from old categories ───────────────────────────
  const [oldSnacks, oldPaquetes, oldCabello, oldBarba] = await Promise.all([
    prisma.category.findUnique({ where: { slug: "snacks"        } }),
    prisma.category.findUnique({ where: { slug: "paquetes"      } }),
    prisma.category.findUnique({ where: { slug: "cabello"       } }),
    prisma.category.findUnique({ where: { slug: "cuidado-barba" } }),
  ]);
  if (oldSnacks)   await prisma.product.updateMany({ where: { categoryId: oldSnacks.id   }, data: { categoryId: comida.id  } });
  if (oldPaquetes) await prisma.product.updateMany({ where: { categoryId: oldPaquetes.id }, data: { categoryId: comida.id  } });
  if (oldCabello)  await prisma.product.updateMany({ where: { categoryId: oldCabello.id  }, data: { categoryId: belleza.id } });
  if (oldBarba)    await prisma.product.updateMany({ where: { categoryId: oldBarba.id    }, data: { categoryId: belleza.id } });

  // ── Products ────────────────────────────────────────────────────────────────
  await prisma.product.upsert({
    where: { sku: "BEV-001" },
    update: { categoryId: bebidas.id },
    create: { name: "Agua Mineral San Pellegrino", sku: "BEV-001", price: 45.0, stock: 24, minStock: 6, categoryId: bebidas.id },
  });
  await prisma.product.upsert({
    where: { sku: "BEV-002" },
    update: { categoryId: bebidas.id },
    create: { name: "Cerveza Artesanal IPA", sku: "BEV-002", price: 85.0, stock: 18, minStock: 6, categoryId: bebidas.id },
  });
  await prisma.product.upsert({
    where: { sku: "BEV-003" },
    update: { categoryId: bebidas.id },
    create: { name: "Bourbon Single Barrel (Shot)", sku: "BEV-003", price: 15.0, stock: 24, minStock: 5, categoryId: bebidas.id },
  });
  await prisma.product.upsert({
    where: { sku: "BEV-004" },
    update: { categoryId: bebidas.id },
    create: { name: "Espresso Doble", sku: "BEV-004", price: 55.0, stock: 30, minStock: 10, categoryId: bebidas.id },
  });
  await prisma.product.upsert({
    where: { sku: "SNK-001" },
    update: { categoryId: comida.id },
    create: { name: "Papas Fritas Premium", sku: "SNK-001", price: 35.0, stock: 20, minStock: 5, categoryId: comida.id },
  });
  await prisma.product.upsert({
    where: { sku: "SNK-002" },
    update: { categoryId: comida.id },
    create: { name: "Maní Tostado con Sal", sku: "SNK-002", price: 25.0, stock: 4, minStock: 5, categoryId: comida.id },
  });
  await prisma.product.upsert({
    where: { sku: "PKG-001" },
    update: { categoryId: comida.id },
    create: { name: "Combo Corte + Bebida", sku: "PKG-001", price: 120.0, stock: 50, minStock: 0, categoryId: comida.id },
  });
  await prisma.product.upsert({
    where: { sku: "BRD-001" },
    update: { categoryId: belleza.id },
    create: { name: "Aceite Signature Reserve", sku: "BRD-001", price: 35.0, stock: 45, minStock: 5, categoryId: belleza.id },
  });
  await prisma.product.upsert({
    where: { sku: "HR-012" },
    update: { categoryId: belleza.id },
    create: { name: "Pomada Texturizante Mate", sku: "HR-012", price: 22.5, stock: 4, minStock: 5, categoryId: belleza.id },
  });

  // ── Admin user ──────────────────────────────────────────────────────────────
  const hashedAdmin = await bcrypt.hash("Churco2026.", 10);
  await prisma.user.upsert({
    where: { email: "admin@groomandgold.com" },
    update: { name: "churcoadmin", email: "churcoadmin@churco.com", password: hashedAdmin },
    create: { name: "churcoadmin", email: "churcoadmin@churco.com", password: hashedAdmin, role: "ADMIN" },
  });

  // ── Employee user ───────────────────────────────────────────────────────────
  const hashedEmployee = await bcrypt.hash("Empleado2026.", 10);
  await prisma.user.upsert({
    where: { email: "empleado@groomandgold.com" },
    update: { name: "userEmpleado", email: "userEmpleado@churco.com", password: hashedEmployee },
    create: { name: "userEmpleado", email: "userEmpleado@churco.com", password: hashedEmployee, role: "EMPLOYEE" },
  });

  console.log("✅ Seed completado — ContaChurco");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
