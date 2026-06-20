import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ==========================================================================
// 1. OBTENER / BUSCAR PRODUCTOS
// ==========================================================================
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

// ==========================================================================
// 2. CREAR NUEVO PRODUCTO (ALTA)
// ==========================================================================
export const createProduct = async (req, res) => {
  try {
    const { code, name, presentation, price, stock, categoryId } = req.body;

    // Validamos si el código ya existe para que no rompa la restricción UNIQUE
    const existe = await prisma.product.findUnique({ where: { code } });
    if (existe) {
      return res
        .status(400)
        .json({ error: "El código de artículo ya existe." });
    }

    const nuevoProducto = await prisma.product.create({
      data: {
        code,
        name,
        presentation,
        price: parseFloat(price),
        stock: parseInt(stock),
        categoryId: parseInt(categoryId),
      },
    });
    res.status(201).json(nuevoProducto);
  } catch (error) {
    console.error("❌ Error al crear producto:", error);
    res.status(500).json({ error: "No se pudo crear el producto." });
  }
};

// ==========================================================================
// 3. MODIFICAR PRODUCTO EXISTENTE (MODIFICACIÓN)
// ==========================================================================
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, presentation, price, stock, categoryId } = req.body;

    const productoActualizado = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        code,
        name,
        presentation,
        price: parseFloat(price),
        stock: parseInt(stock),
        categoryId: parseInt(categoryId),
      },
    });
    res.json(productoActualizado);
  } catch (error) {
    console.error("❌ Error al actualizar producto:", error);
    res.status(500).json({ error: "No se pudo actualizar el producto." });
  }
};

// ==========================================================================
// 4. ELIMINAR UN PRODUCTO (BAJA)
// ==========================================================================
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params; // Sincronizado para recibir el ID numérico desde el Frontend

    await prisma.product.delete({
      where: { id: parseInt(id) }, // Corregido a id entero para evitar choques con MySQL
    });

    return res.status(200).json({
      message: "Producto eliminado correctamente de la base de datos.",
    });
  } catch (error) {
    console.error("❌ Error al eliminar producto:", error);
    return res.status(500).json({ error: "No se pudo eliminar el producto." });
  }
};
