# API Documentation - Favorites, Similar Products, Recently Viewed

## Favorites API

### 1. Get User Favorites
- **Endpoint**: `GET /api/favorites`
- **Authentication**: Required
- **Description**: Lấy danh sách sản phẩm yêu thích của user
- **Response**: Array of products with rating information

### 2. Add to Favorites
- **Endpoint**: `POST /api/favorites/add`
- **Authentication**: Required
- **Body**: `{ "productId": "string" }`
- **Description**: Thêm sản phẩm vào danh sách yêu thích

### 3. Remove from Favorites
- **Endpoint**: `DELETE /api/favorites/remove/:productId`
- **Authentication**: Required
- **Description**: Xóa sản phẩm khỏi danh sách yêu thích

### 4. Check if Favorite
- **Endpoint**: `GET /api/favorites/check/:productId`
- **Authentication**: Required
- **Description**: Kiểm tra sản phẩm có trong danh sách yêu thích không

## Similar Products API

### 1. Get Similar Products
- **Endpoint**: `GET /api/products/:id/similar?limit=8`
- **Authentication**: Not required
- **Description**: Lấy sản phẩm tương tự dựa trên category
- **Query Parameters**:
  - `limit`: Số lượng sản phẩm trả về (default: 8)

## Recently Viewed API

### 1. Get Recently Viewed
- **Endpoint**: `GET /api/products/recently-viewed?limit=8`
- **Authentication**: Required
- **Description**: Lấy danh sách sản phẩm đã xem gần đây
- **Query Parameters**:
  - `limit`: Số lượng sản phẩm trả về (default: 8)

### 2. Add to Recently Viewed
- **Endpoint**: `POST /api/products/recently-viewed/add`
- **Authentication**: Required
- **Body**: `{ "productId": "string" }`
- **Description**: Thêm sản phẩm vào danh sách đã xem

## Database Schema Changes

### New Tables Added:

1. **favorite**
   - `id`: String (UUID, Primary Key)
   - `userId`: String (Foreign Key to user.id)
   - `productId`: String (Foreign Key to product.id)
   - `createdAt`: DateTime
   - Unique constraint on (userId, productId)

2. **recentlyViewed**
   - `id`: String (UUID, Primary Key)
   - `userId`: String (Foreign Key to user.id)
   - `productId`: String (Foreign Key to product.id)
   - `viewedAt`: DateTime
   - Indexes on userId, productId, viewedAt

## Frontend Integration

### Redux Slices:
- `favoriteSlice`: Quản lý state cho sản phẩm yêu thích
- `similarProductsSlice`: Quản lý state cho sản phẩm tương tự
- `recentlyViewedSlice`: Quản lý state cho sản phẩm đã xem

### Components:
- `FavoriteButton`: Nút yêu thích sản phẩm
- `SimilarProducts`: Hiển thị sản phẩm tương tự
- `FavoritesPage`: Trang danh sách yêu thích
- `RecentlyViewedPage`: Trang sản phẩm đã xem

## Setup Instructions

1. **Backend Setup**:
   ```bash
   cd ute_shop_backend
   npm install
   npx prisma migrate dev --name add_favorites_and_recently_viewed
   npm start
   ```

2. **Frontend Setup**:
   ```bash
   cd ute_shop
   npm install
   npm run dev
   ```

## Features Implemented

✅ **Favorites System**:
- Add/remove products from favorites
- Check if product is favorited
- Display favorites page with product cards

✅ **Similar Products**:
- Get products from same category
- Exclude current product
- Display in product detail page

✅ **Recently Viewed**:
- Track product views automatically
- Limit to 50 most recent views
- Display in dedicated page

✅ **Rating System**:
- Calculate average rating from reviews
- Display star ratings in product cards
- Show review count

## Notes

- All favorite and recently viewed operations require user authentication
- Similar products are based on category matching
- Recently viewed automatically updates when viewing product details
- Rating calculations are done server-side for consistency
