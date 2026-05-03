const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

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
    { sku: "PKG-001", name: "Combo Corte + Bebida",  price: 35000, stock: 50, minStock: 0,  image: null,                                    categoryId: comida.id },

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
  .catch((e) => { console.error("Seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
