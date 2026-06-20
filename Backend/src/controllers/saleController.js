import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 1. REGISTRAR UNA NUEVA VENTA (CON RESTA DE STOCK EN TRANSACCIÓN ACID)
export const createSale = async (req, res) => {
  try {
    const { total, operator, payment, items } = req.body;

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ error: "No se puede registrar una venta sin artículos." });
    }

    // Ejecutamos una transacción integrada para garantizar consistencia absoluta
    const resultado = await prisma.$transaction(async (tx) => {
      // A. Creamos el encabezado de la venta
      const nuevaVenta = await tx.sale.create({
        data: {
          total: parseFloat(total),
          operator: operator || "ANÓNIMO",
          payment: payment || "EFECTIVO",
        },
      });

      // B. Procesamos cada artículo del remito y actualizamos existencias
      for (const item of items) {
        // Buscamos el producto por su código único
        const prod = await tx.product.findUnique({
          where: { code: item.code },
        });
        if (!prod)
          throw new Error(`El producto con código ${item.code} no existe.`);
        if (prod.stock < item.cant)
          throw new Error(
            `Stock insuficiente para: ${prod.name}. Disponibles: ${prod.stock}`,
          );

        // Creamos el detalle histórico fijando el precio de hoy
        await tx.saleDetail.create({
          data: {
            saleId: nuevaVenta.id,
            productId: prod.id,
            quantity: parseInt(item.cant),
            price: parseFloat(prod.price),
          },
        });

        // Descontamos las unidades del maestro físico
        await tx.product.update({
          where: { id: prod.id },
          data: { stock: prod.stock - parseInt(item.cant) },
        });
      }

      return nuevaVenta;
    });

    res
      .status(201)
      .json({
        message: "Venta asentada y stock actualizado con éxito.",
        sale: resultado,
      });
  } catch (error) {
    console.error("❌ Error en transacción de venta:", error);
    res
      .status(500)
      .json({
        error: error.message || "Error al procesar la liquidación de venta.",
      });
  }
};

// 2. OBTENER HISTORIAL FILTRADO PARA EL CIERRE DE CAJA DIARIO
export const getSalesHistory = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, productoId } = req.query;

    let whereClause = {};

    // Filtro por rango elástico de fechas (formato YYYY-MM-DD)
    if (fechaInicio || fechaFin) {
      whereClause.createdAt = {};
      if (fechaInicio) {
        whereClause.createdAt.gte = new Date(`${fechaInicio}T00:00:00.000Z`);
      }
      if (fechaFin) {
        whereClause.createdAt.lte = new Date(`${fechaFin}T23:59:59.999Z`);
      }
    }

    // Filtro cruzado por un producto específico mapeado en los detalles
    if (productoId) {
      whereClause.details = {
        some: {
          productId: parseInt(productoId),
        },
      };
    }

    // Buscamos los registros incluyendo las relaciones maestro-detalle para el frontend
    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        details: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(sales);
  } catch (error) {
    console.error("❌ Error al recuperar el historial:", error);
    res
      .status(500)
      .json({ error: "No se pudieron obtener los registros analíticos." });
  }
};
