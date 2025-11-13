import express from "express";
import { createProduct, fetchAllProducts, updateProduct } from "../controllers/productController.js";
import { authorizedRoles, isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/admin/create', isAuthenticated, authorizedRoles('Admin'), createProduct);
router.get('/', isAuthenticated, authorizedRoles('Admin'), fetchAllProducts);
router.put('/:id', isAuthenticated, authorizedRoles('Admin'), updateProduct);

export default router;