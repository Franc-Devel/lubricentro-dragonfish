import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Regenerando catálogo maestro con códigos secuenciales limpios...");

  const catAceites = await prisma.category.upsert({ where: { slug: "aceites" }, update: {}, create: { name: "Aceites y Lubricantes", slug: "aceites" } });
  const catFiltros = await prisma.category.upsert({ where: { slug: "filtros" }, update: {}, create: { name: "Filtros de Motor", slug: "filtros" } });
  const catAditivos = await prisma.category.upsert({ where: { slug: "aditivos" }, update: {}, create: { name: "Aditivos y Fluidos", slug: "aditivos" } });

  const productos = [
    { code: "001", name: "Aceite Bardahl 10w40 Semisintetico", presentation: "Bidon 4L", price: 45000, stock: 25, categoryId: catAceites.id },
    { code: "002", name: "Aceite Bardahl 5w30 Sintetico Premium", presentation: "Bidon 4L", price: 62000, stock: 18, categoryId: catAceites.id },
    { code: "003", name: "Aceite Castrol Magnatec 10w40", presentation: "Bidon 4L", price: 49000, stock: 12, categoryId: catAceites.id },
    { code: "004", name: "Aceite Total Quartz 7000 15w40", presentation: "Bidon 4L", price: 41000, stock: 30, categoryId: catAceites.id },
    { code: "005", name: "Aceite Mobil Super 3000 5w40", presentation: "Bidon 4L", price: 65000, stock: 10, categoryId: catAceites.id },
    { code: "006", name: "Aceite Elaion F50 5w30 Sintetico", presentation: "Bidon 4L", price: 58000, stock: 22, categoryId: catAceites.id },
    { code: "007", name: "Aceite Shell Helix HX7 10w40", presentation: "Bidon 4L", price: 47000, stock: 15, categoryId: catAceites.id },
    
    { code: "008", name: "Filtro de Aceite Wega WO-200", presentation: "Unidad", price: 7500, stock: 40, categoryId: catFiltros.id },
    { code: "009", name: "Filtro de Aire Wega WR-324", presentation: "Unidad", price: 9800, stock: 15, categoryId: catFiltros.id },
    { code: "010", name: "Filtro Nafta Fram G3", presentation: "Unidad", price: 5400, stock: 50, categoryId: catFiltros.id },
    { code: "011", name: "Filtro de Habitaculo Mann Filter", presentation: "Unidad", price: 11000, stock: 8, categoryId: catFiltros.id },
    { code: "012", name: "Filtro Gasoil Wega FCD-2066", presentation: "Unidad", price: 14500, stock: 14, categoryId: catFiltros.id },
    { code: "013", name: "Filtro de Aceite Mann W712", presentation: "Unidad", price: 8200, stock: 35, categoryId: catFiltros.id },
    { code: "014", name: "Filtro de Aire Mann C29004", presentation: "Unidad", price: 10500, stock: 20, categoryId: catFiltros.id },

    { code: "015", name: "Limpia Inyectores Nafta Ultra Conc.", presentation: "330ml", price: 8500, stock: 36, categoryId: catAditivos.id },
    { code: "016", name: "Limpia Inyectores Diesel Maxima F.", presentation: "330ml", price: 9200, stock: 24, categoryId: catAditivos.id },
    { code: "017", name: "Liquido de Frenos Wagner DOT 4", presentation: "500ml", price: 6800, stock: 18, categoryId: catAditivos.id },
    { code: "018", name: "Anticongelante Refrigerante Bardahl Tir", presentation: "1L", price: 5200, stock: 60, categoryId: catAditivos.id },
    { code: "019", name: "Aditivo Motor Bardahl Maxima Compresion", presentation: "450ml", price: 7900, stock: 20, categoryId: catAditivos.id },
    { code: "020", name: "Limpia Motores Interno (Engine Flush)", presentation: "500ml", price: 7100, stock: 15, categoryId: catAditivos.id }
  ];

  for (const p of productos) {
     await prisma.product.upsert({ where: { code: p.code }, update: p, create: p });
  }
  console.log("✅ Base de datos repoblada exitosamente con códigos secuenciales únicos.");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());