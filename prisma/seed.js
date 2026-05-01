const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: "bebidas"       }, update: {}, create: { name: "Bebidas",          slug: "bebidas"       } }),
    prisma.category.upsert({ where: { slug: "snacks"        }, update: {}, create: { name: "Snacks",           slug: "snacks"        } }),
    prisma.category.upsert({ where: { slug: "paquetes"      }, update: {}, create: { name: "Paquetes",         slug: "paquetes"      } }),
    prisma.category.upsert({ where: { slug: "cuidado-barba" }, update: {}, create: { name: "Cuidado de Barba", slug: "cuidado-barba" } }),
    prisma.category.upsert({ where: { slug: "cabello"       }, update: {}, create: { name: "Cabello",          slug: "cabello"       } }),
  ]);
  const [bebidas, snacks, paquetes, barba, cabello] = categories;

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

    // ── Snacks ───────────────────────────────────────────────────────────────
    { sku: "SNK-001", name: "Papa Margarita",        price: 2500,  stock: 30, minStock: 8,  image: "/imagenes/papa-margarita.jpg",          categoryId: snacks.id },
    { sku: "SNK-002", name: "Doritos",               price: 2500,  stock: 30, minStock: 8,  image: "/imagenes/doritos.webp",                categoryId: snacks.id },
    { sku: "SNK-003", name: "Cheetos",               price: 2500,  stock: 30, minStock: 8,  image: "/imagenes/cheetos.png",                 categoryId: snacks.id },
    { sku: "SNK-004", name: "Cheetos Boliqueso",     price: 2500,  stock: 24, minStock: 8,  image: "/imagenes/cheetos Boliqueso.webp",      categoryId: snacks.id },
    { sku: "SNK-005", name: "Choclitos",             price: 2000,  stock: 30, minStock: 8,  image: "/imagenes/Choclitos.png",               categoryId: snacks.id },
    { sku: "SNK-006", name: "Chestris",              price: 2000,  stock: 24, minStock: 8,  image: "/imagenes/Chestris.webp",               categoryId: snacks.id },
    { sku: "SNK-007", name: "Detodito",              price: 2000,  stock: 24, minStock: 8,  image: "/imagenes/detodito.webp",               categoryId: snacks.id },
    { sku: "SNK-008", name: "NatuChips",             price: 2000,  stock: 20, minStock: 6,  image: "/imagenes/NatuChips.webp",              categoryId: snacks.id },
    { sku: "SNK-009", name: "Galletas",              price: 1500,  stock: 24, minStock: 8,  image: "/imagenes/Galletas.png",                categoryId: snacks.id },
    { sku: "SNK-010", name: "Maní",                  price: 1500,  stock: 20, minStock: 6,  image: "/imagenes/Maní.png",                    categoryId: snacks.id },

    // ── Cabello ──────────────────────────────────────────────────────────────
    { sku: "HR-001",  name: "Cera en Polvo Rolda",   price: 18000, stock: 10, minStock: 3,  image: "/imagenes/Cera en Polvo Rolda.png",     categoryId: cabello.id },
    { sku: "HR-002",  name: "Cera Red One",          price: 22000, stock: 8,  minStock: 3,  image: "/imagenes/Cera red One.avif",           categoryId: cabello.id },
    { sku: "HR-003",  name: "Crema Churcos Rolda",   price: 15000, stock: 10, minStock: 3,  image: "/imagenes/Crema CHURCOS Rolda.webp",    categoryId: cabello.id },
    { sku: "HR-004",  name: "Crema White Rolda",     price: 15000, stock: 10, minStock: 3,  image: "/imagenes/Crema white Rolda.png",       categoryId: cabello.id },
    { sku: "HR-005",  name: "Gel Black Rolda",       price: 12000, stock: 12, minStock: 4,  image: "/imagenes/Gel black Rolda.jpg",         categoryId: cabello.id },
    { sku: "HR-006",  name: "Minoxidil 5%",          price: 35000, stock: 6,  minStock: 2,  image: "/imagenes/minoxidil_2.webp",             categoryId: cabello.id },

    // ── Cuidado de Barba ─────────────────────────────────────────────────────
    { sku: "BRD-001", name: "Mascarilla Black Mask", price: 25000, stock: 8,  minStock: 2,  image: "/imagenes/Mascarilla Black Mask.avif",  categoryId: barba.id  },

    // ── Paquetes ─────────────────────────────────────────────────────────────
    { sku: "PKG-001", name: "Combo Corte + Bebida",  price: 35000, stock: 50, minStock: 0,  image: null,                                    categoryId: paquetes.id },
  ];

  for (const p of products) {
    await prisma.product.upsert({ where: { sku: p.sku }, update: {}, create: p });
  }

  await prisma.user.upsert({
    where: { email: "admin@groomandgold.com" },
    update: {},
    create: {
      name: "Master Barber",
      email: "admin@groomandgold.com",
      password: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
    },
  });
  await prisma.user.upsert({
    where: { email: "empleado@groomandgold.com" },
    update: {},
    create: {
      name: "Carlos Barber",
      email: "empleado@groomandgold.com",
      password: await bcrypt.hash("empleado123", 10),
      role: "EMPLOYEE",
    },
  });

  console.log("✅ Seed completado — Groom & Gold");
}

main()
  .catch((e) => { console.error("Seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
