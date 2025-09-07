
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
        discountPrice: variant.discountPrice,
        product: variant.product ? productDto(variant.product) : { id: variant.productId, name: "Tên sản phẩm", description: "" },
    };
};


export const cartItemDto = (cartItem) => {
    return {
        id: cartItem.id,
        quantity: cartItem.quantity,
        variant: cartItem.variant ? productVariantDto(cartItem.variant) : null,
    };
};
