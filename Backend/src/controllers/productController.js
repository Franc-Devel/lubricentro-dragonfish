import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getProducts = async (req, res) => {
  try {
    const { q } = req.query;
    let whereClause = {};

    if (q) {
      const queryClean = q.trim().toUpperCase();
      whereClause = {
        OR: [
          { name: { contains: queryClean } },
          { code: { contains: queryClean } }
        ]
      };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: { category: true }
    });
    res.json(products);
  } catch (error) {
    console.error("❌ Error en el motor de búsqueda:", error);
    res.status(500).json({ error: error.message });
  }
};