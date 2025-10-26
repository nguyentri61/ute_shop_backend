
export const productDto = (product) => {
    return {
        id: product.id,
        name: product.name,
        description: product.description,
    };
};

export const productVariantDto = (variant) => {
    return {
        id: variant.id,
        color: variant.color,
        size: variant.size,
        price: variant.price,
        stock: variant.stock,
        discountPrice: variant.discountPrice,
        product: variant.product ? productDto(variant.product) : { id: variant.productId, name: "Tên sản phẩm", description: "" },
    };
};


export const cartItemDto = (cartItem) => {
    const imageUrl = cartItem?.variant?.product?.productImage?.[0]?.url ?? null;

    return {
        id: cartItem.id,
        quantity: cartItem.quantity,
        image: imageUrl,
        variant: cartItem.variant ? productVariantDto(cartItem.variant) : null,
    };
};
