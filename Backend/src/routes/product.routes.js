import { Router } from "express";
import {
  getProducts,
  deleteProduct,
  createProduct,
  updateProduct,
} from "../controllers/productController.js";
import { createSale, getSalesHistory } from "../controllers/saleController.js"; // ◄ IMPORTAMOS LOS NUEVOS MÉTODOS

const router = Router();

// Rutas del catálogo existentes
router.get("/productos", getProducts);
router.post("/productos", createProduct);
router.put("/productos/:id", updateProduct);
router.delete("/productos/:id", deleteProduct);

// Rutas nuevas para el módulo de auditoría y cierre de caja diario
router.post("/ventas", createSale); // ◄ POST para asentar la venta y restar stock
router.get("/ventas/historial", getSalesHistory); // ◄ GET para consultar el historial filtrado

export default router;
