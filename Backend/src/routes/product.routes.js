import { Router } from "express";
import {
  getProducts,
  deleteProduct,
  createProduct,
  updateProduct,
} from "../controllers/productController.js";
// ◄ MODIFICAMOS ESTA LÍNEA agregando deleteSale al final:
import {
  createSale,
  getSalesHistory,
  deleteSale,
} from "../controllers/saleController.js";

const router = Router();

// Rutas del catálogo existentes
router.get("/productos", getProducts);
router.post("/productos", createProduct);
router.put("/productos/:id", updateProduct);
router.delete("/productos/:id", deleteProduct);

// Rutas para el módulo de auditoría y cierre de caja diario
router.post("/ventas", createSale);
router.get("/ventas/historial", getSalesHistory);
router.delete("/ventas/:id", deleteSale); // ◄ Ahora sí va a reconocer qué es deleteSale

export default router;
