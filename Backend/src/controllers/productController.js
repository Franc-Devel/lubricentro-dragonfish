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
          { code: { contains: queryClean } },
        ],
      };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: { category: true },
    });
    res.json(products);
  } catch (error) {
    console.error("❌ Error en el motor de búsqueda:", error);
    res.status(500).json({ error: error.message });
  }
};

// Método para eliminar un producto por código o ID
export const deleteProduct = async (req, res) => {
  try {
    const { code } = req.params; // O req.params.id según cómo indexes

    await prisma.product.delete({
      where: { code: code },
    });

    return res
      .status(200)
      .json({
        message: "Producto eliminado correctamente de la base de datos.",
      });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return res.status(500).json({ error: "No se pudo eliminar el producto." });
  }
};
