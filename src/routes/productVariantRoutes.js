const express = require('express');
const router = express.Router();
const productVariantController = require('../controllers/productVariantController');

// Lấy tất cả variant của 1 product
router.get('/product/:productId', productVariantController.getVariantsByProduct);

// Lấy variant theo id
router.get('/:id', productVariantController.getVariant);

// Tạo mới variant
router.post('/', productVariantController.createVariant);

// Cập nhật variant
router.put('/:id', productVariantController.updateVariant);

// Xóa variant
router.delete('/:id', productVariantController.deleteVariant);

module.exports = router;
