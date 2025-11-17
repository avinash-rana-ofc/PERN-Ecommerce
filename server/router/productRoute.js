import express from "express";
import { createProduct, deleteProduct, deleteReview, fetchAllProducts, fetchSingleProduct, postProductReview, updateProduct } from "../controllers/productController.js";
import { authorizedRoles, isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/admin/create', isAuthenticated, authorizedRoles('Admin'), createProduct);
router.get('/', isAuthenticated, authorizedRoles('Admin'), fetchAllProducts);
router.get('/singleProduct/:productId', isAuthenticated, authorizedRoles('Admin'), fetchSingleProduct);
router.put('/post-new/review/:productId', isAuthenticated, postProductReview);
router.put('/admin/update/:productId', isAuthenticated, authorizedRoles('Admin'), updateProduct);
router.delete('/admin/delete/:productId', isAuthenticated, authorizedRoles('Admin'), deleteProduct);
router.delete('/deleteReview', isAuthenticated, deleteReview);

export default router;