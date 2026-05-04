import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Branches ────────────────────────────────────────────────────────────────
  const [churco, suc2] = await Promise.all([
    prisma.branch.upsert({
      where: { slug: "churco" },
      update: { name: "Sucursal Churco" },
      create: { name: "Sucursal Churco", slug: "churco" },
    }),
    prisma.branch.upsert({
      where: { slug: "suc2" },
      update: { name: "Sucursal 2" },
      create: { name: "Sucursal 2", slug: "suc2" },
    }),
  ]);

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
  // Desactivar Combo Corte + Bebida si existe (ya no se usa)
  await prisma.product.updateMany({ where: { sku: "PKG-001" }, data: { active: false } }).catch(() => {});
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
    where: { email: "churcoadmin@churco.com" },
    update: { name: "churcoadmin", password: hashedAdmin, branchId: churco.id },
    create: { name: "churcoadmin", email: "churcoadmin@churco.com", password: hashedAdmin, role: "ADMIN", branchId: churco.id },
  });
  // fallback: old email
  await prisma.user.upsert({
    where: { email: "admin@groomandgold.com" },
    update: { name: "churcoadmin", email: "churcoadmin@churco.com", password: hashedAdmin, branchId: churco.id },
    create: { name: "churcoadmin", email: "churcoadmin@churco.com", password: hashedAdmin, role: "ADMIN", branchId: churco.id },
  }).catch(() => { /* ya existe con nuevo email, ignorar */ });

  // Desactivar usuario genérico userSuc2 (ya no se usa, reemplazado por barberos individuales)
  await prisma.user.updateMany({ where: { email: "userSuc2@gmail.com" }, data: { active: false } }).catch(() => {});

  // ── Barber employees ────────────────────────────────────────────────────────
  await Promise.all([
    prisma.user.upsert({
      where: { email: "maxwell@churco.com" },
      update: { branchId: suc2.id },
      create: { name: "Maxwell", email: "maxwell@churco.com", password: await bcrypt.hash("Maxwell2026.", 10), role: "EMPLOYEE", branchId: suc2.id },
    }),
    prisma.user.upsert({
      where: { email: "freddy@churco.com" },
      update: { branchId: suc2.id },
      create: { name: "Freddy", email: "freddy@churco.com", password: await bcrypt.hash("Freddy2026.", 10), role: "EMPLOYEE", branchId: suc2.id },
    }),
    prisma.user.upsert({
      where: { email: "mauricio@churco.com" },
      update: { branchId: suc2.id },
      create: { name: "Mauricio", email: "mauricio@churco.com", password: await bcrypt.hash("Mauricio2026.", 10), role: "EMPLOYEE", branchId: suc2.id },
    }),
    prisma.user.upsert({
      where: { email: "carlos@churco.com" },
      update: { branchId: suc2.id },
      create: { name: "Carlos", email: "carlos@churco.com", password: await bcrypt.hash("Carlos2026.", 10), role: "EMPLOYEE", branchId: suc2.id },
    }),
  ]);

  // ── Migrate existing data to Sucursal Churco ────────────────────────────────
  await prisma.sale.updateMany({ where: { branchId: null }, data: { branchId: churco.id } }).catch(() => {});
  await prisma.purchase.updateMany({ where: { branchId: null }, data: { branchId: churco.id } }).catch(() => {});
  await prisma.fixedExpense.updateMany({ where: { branchId: null }, data: { branchId: churco.id } }).catch(() => {});

  console.log("✅ Seed completado — ContaChurco (multi-sucursal)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
