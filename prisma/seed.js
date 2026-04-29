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
    { sku: "BEV-001", name: "Agua Mineral San Pellegrino",  price: 45.0,  stock: 24, minStock: 6,  categoryId: bebidas.id  },
    { sku: "BEV-002", name: "Cerveza Artesanal IPA",        price: 85.0,  stock: 18, minStock: 6,  categoryId: bebidas.id  },
    { sku: "BEV-003", name: "Bourbon Single Barrel (Shot)", price: 15.0,  stock: 24, minStock: 5,  categoryId: bebidas.id  },
    { sku: "BEV-004", name: "Espresso Doble",               price: 55.0,  stock: 30, minStock: 10, categoryId: bebidas.id  },
    { sku: "SNK-001", name: "Papas Fritas Premium",         price: 35.0,  stock: 20, minStock: 5,  categoryId: snacks.id   },
    { sku: "SNK-002", name: "Maní Tostado con Sal",         price: 25.0,  stock: 4,  minStock: 5,  categoryId: snacks.id   },
    { sku: "PKG-001", name: "Combo Corte + Bebida",         price: 120.0, stock: 50, minStock: 0,  categoryId: paquetes.id },
    { sku: "BRD-001", name: "Aceite Signature Reserve",     price: 35.0,  stock: 45, minStock: 5,  categoryId: barba.id    },
    { sku: "HR-012",  name: "Pomada Texturizante Mate",     price: 22.5,  stock: 4,  minStock: 5,  categoryId: cabello.id  },
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
