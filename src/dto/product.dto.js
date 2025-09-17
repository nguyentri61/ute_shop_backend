// src/dto/product.dto.js

// DTO cho ảnh sản phẩm
export const ProductImageDTO = (image) => ({
  id: image.id,
  url: image.url,
});

// DTO cho category
export const CategoryDTO = (category) => ({
  id: category.id,
  name: category.name,
  icon: category.icon,
});

// DTO chi tiết sản phẩm
export const ProductDetailDTO = (product) => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: product.price,
  discountPrice: product.discountPrice,
  stock: product.stock,
  viewCount: product.viewCount,
  createdAt: product.createdAt,
  category: CategoryDTO(product.category),
  images: product.productImage.map(ProductImageDTO),
  variants: product.variants
    ? product.variants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      color: variant.color,
      stock: variant.stock,
      price: variant.price,
      discountPrice: variant.discountPrice,
    }))
    : [],
});
