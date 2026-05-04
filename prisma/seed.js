const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

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

  const products = [
    // ── Bebidas ──────────────────────────────────────────────────────────────
    { sku: "BEV-001", name: "Agua Brisa",            price: 2000,  stock: 24, minStock: 6,  image: "/imagenes/agua_brisa.png",              categoryId: bebidas.id },
    { sku: "BEV-002", name: "Águila Original",       price: 4000,  stock: 24, minStock: 6,  image: "/imagenes/Águila original.webp",        categoryId: bebidas.id },
    { sku: "BEV-003", name: "Águila Light",          price: 4000,  stock: 24, minStock: 6,  image: "/imagenes/Águila ligth.jpg",            categoryId: bebidas.id },
    { sku: "BEV-004", name: "Club Colombia",         price: 5000,  stock: 18, minStock: 6,  image: "/imagenes/Club Colombia.webp",          categoryId: bebidas.id },
    { sku: "BEV-005", name: "Costeña",               price: 4000,  stock: 18, minStock: 6,  image: "/imagenes/Costeña.png",                 categoryId: bebidas.id },
    { sku: "BEV-006", name: "Coronita",              price: 6000,  stock: 12, minStock: 4,  image: "/imagenes/Coronita.png",                categoryId: bebidas.id },
    { sku: "BEV-007", name: "Bretaña",               price: 4500,  stock: 18, minStock: 6,  image: "/imagenes/Bretaña.png",                 categoryId: bebidas.id },
    { sku: "BEV-008", name: "Cola y Pola",           price: 4000,  stock: 12, minStock: 4,  image: "/imagenes/Cola y Pola.webp",            categoryId: bebidas.id },
    { sku: "BEV-009", name: "Coca Cola",             price: 3000,  stock: 24, minStock: 8,  image: "/imagenes/Coca cola.png",               categoryId: bebidas.id },
    { sku: "BEV-010", name: "Pony Malta",            price: 3000,  stock: 24, minStock: 8,  image: "/imagenes/pony_Malta.png",              categoryId: bebidas.id },
    { sku: "BEV-011", name: "Gatorade",              price: 4000,  stock: 20, minStock: 6,  image: "/imagenes/Gatorade.png",                categoryId: bebidas.id },
    { sku: "BEV-012", name: "Sporade",               price: 3500,  stock: 20, minStock: 6,  image: "/imagenes/Sporade.webp",                categoryId: bebidas.id },
    { sku: "BEV-013", name: "Vive 100",              price: 2500,  stock: 20, minStock: 6,  image: "/imagenes/Vive 100.webp",               categoryId: bebidas.id },
    { sku: "BEV-014", name: "Jugo del Valle",        price: 3000,  stock: 18, minStock: 6,  image: "/imagenes/Jugo del valle.webp",         categoryId: bebidas.id },
    { sku: "BEV-015", name: "Quatro",                price: 2500,  stock: 24, minStock: 8,  image: "/imagenes/Quatro.avif",                 categoryId: bebidas.id },
    { sku: "BEV-016", name: "Ginger Beer",           price: 5000,  stock: 12, minStock: 4,  image: "/imagenes/Ginger.jpg",                  categoryId: bebidas.id },

    // ── Comida ───────────────────────────────────────────────────────────────
    { sku: "SNK-001", name: "Papa Margarita",        price: 2500,  stock: 30, minStock: 8,  image: "/imagenes/papa-margarita.jpg",          categoryId: comida.id },
    { sku: "SNK-002", name: "Doritos",               price: 2500,  stock: 30, minStock: 8,  image: "/imagenes/doritos.webp",                categoryId: comida.id },
    { sku: "SNK-003", name: "Cheetos",               price: 2500,  stock: 30, minStock: 8,  image: "/imagenes/cheetos.png",                 categoryId: comida.id },
    { sku: "SNK-004", name: "Cheetos Boliqueso",     price: 2500,  stock: 24, minStock: 8,  image: "/imagenes/cheetos Boliqueso.webp",      categoryId: comida.id },
    { sku: "SNK-005", name: "Choclitos",             price: 2000,  stock: 30, minStock: 8,  image: "/imagenes/Choclitos.png",               categoryId: comida.id },
    { sku: "SNK-006", name: "Chestris",              price: 2000,  stock: 24, minStock: 8,  image: "/imagenes/Chestris.webp",               categoryId: comida.id },
    { sku: "SNK-007", name: "Detodito",              price: 2000,  stock: 24, minStock: 8,  image: "/imagenes/detodito.webp",               categoryId: comida.id },
    { sku: "SNK-008", name: "NatuChips",             price: 2000,  stock: 20, minStock: 6,  image: "/imagenes/NatuChips.webp",              categoryId: comida.id },
    { sku: "SNK-009", name: "Galletas",              price: 1500,  stock: 24, minStock: 8,  image: "/imagenes/Galletas.png",                categoryId: comida.id },
    { sku: "SNK-010", name: "Maní",                  price: 1500,  stock: 20, minStock: 6,  image: "/imagenes/Maní.png",                    categoryId: comida.id },

    // ── Belleza ──────────────────────────────────────────────────────────────
    { sku: "HR-001",  name: "Cera en Polvo Rolda",   price: 18000, stock: 10, minStock: 3,  image: "/imagenes/Cera en Polvo Rolda.png",     categoryId: belleza.id },
    { sku: "HR-002",  name: "Cera Red One",          price: 22000, stock: 8,  minStock: 3,  image: "/imagenes/Cera red One.avif",           categoryId: belleza.id },
    { sku: "HR-003",  name: "Crema Churcos Rolda",   price: 15000, stock: 10, minStock: 3,  image: "/imagenes/Crema CHURCOS Rolda.webp",    categoryId: belleza.id },
    { sku: "HR-004",  name: "Crema White Rolda",     price: 15000, stock: 10, minStock: 3,  image: "/imagenes/Crema white Rolda.png",       categoryId: belleza.id },
    { sku: "HR-005",  name: "Gel Black Rolda",       price: 12000, stock: 12, minStock: 4,  image: "/imagenes/Gel black Rolda.jpg",         categoryId: belleza.id },
    { sku: "HR-006",  name: "Minoxidil 5%",          price: 35000, stock: 6,  minStock: 2,  image: "/imagenes/minoxidil_2.webp",            categoryId: belleza.id },
    { sku: "BRD-001", name: "Mascarilla Black Mask", price: 25000, stock: 8,  minStock: 2,  image: "/imagenes/Mascarilla Black Mask.avif",  categoryId: belleza.id },
  ];

  for (const p of products) {
    await prisma.product.upsert({ where: { sku: p.sku }, update: { categoryId: p.categoryId }, create: p });
  }

  // Desactivar Combo Corte + Bebida si existe (ya no se usa)
  await prisma.product.updateMany({ where: { sku: "PKG-001" }, data: { active: false } }).catch(() => {});

  // ── Admin user ──────────────────────────────────────────────────────────────
  const hashedAdmin = await bcrypt.hash("Churco2026.", 10);
  await prisma.user.upsert({
    where: { email: "churcoadmin@churco.com" },
    update: { name: "churcoadmin", password: hashedAdmin, branchId: churco.id },
    create: { name: "churcoadmin", email: "churcoadmin@churco.com", password: hashedAdmin, role: "ADMIN", branchId: churco.id },
  });

  // Desactivar usuario genérico userSuc2 (reemplazado por barberos individuales)
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

  // ── Migrate existing records to Sucursal Churco (safe: only if branchId missing) ──
  // These run via raw SQL to handle null branchId from before migration
  await prisma.$executeRawUnsafe(
    `UPDATE "Sale" SET "branchId" = '${churco.id}' WHERE "branchId" IS NULL OR "branchId" = ''`
  ).catch(() => {});
  await prisma.$executeRawUnsafe(
    `UPDATE "Purchase" SET "branchId" = '${churco.id}' WHERE "branchId" IS NULL OR "branchId" = ''`
  ).catch(() => {});
  await prisma.$executeRawUnsafe(
    `UPDATE "FixedExpense" SET "branchId" = '${churco.id}' WHERE "branchId" IS NULL OR "branchId" = ''`
  ).catch(() => {});
  await prisma.$executeRawUnsafe(
    `UPDATE "User" SET "branchId" = '${churco.id}' WHERE "branchId" IS NULL OR "branchId" = ''`
  ).catch(() => {});

  // ── BranchProduct: inicializar stock por sucursal ───────────────────────────
  const allProducts = await prisma.product.findMany();
  for (const product of allProducts) {
    await prisma.branchProduct.upsert({
      where: { productId_branchId: { productId: product.id, branchId: churco.id } },
      update: {},
      create: { productId: product.id, branchId: churco.id, stock: product.stock, minStock: product.minStock },
    });
    await prisma.branchProduct.upsert({
      where: { productId_branchId: { productId: product.id, branchId: suc2.id } },
      update: {},
      create: { productId: product.id, branchId: suc2.id, stock: 0, minStock: product.minStock },
    });
  }

  // Migrar StockMovements sin branchId a Sucursal Churco
  await prisma.$executeRawUnsafe(
    `UPDATE "StockMovement" SET "branchId" = '${churco.id}' WHERE "branchId" IS NULL`
  ).catch(() => {});

  console.log("✅ Seed completado — ContaChurco (multi-sucursal)");
}

main()
  .catch((e) => { console.error("Seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
