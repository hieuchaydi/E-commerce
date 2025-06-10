# 🛒 Shopee Clone - E-commerce Website

Shopee Clone là một dự án thương mại điện tử mô phỏng nền tảng Shopee, được xây dựng với **Django** cho backend và **React** cho frontend. Dự án hỗ trợ xác thực người dùng với hai vai trò (Seller và Customer), quản lý sản phẩm, giỏ hàng, đơn hàng, đánh giá sản phẩm, và các chức năng dành cho quản trị viên.

---

## 🚀 Tính Năng Chính

### Người Dùng
- ✅ **Đăng ký** với hai vai trò: **Seller** (người bán) hoặc **Customer** (khách hàng)
- ✅ Đăng nhập, đăng xuất
- 👤 Xem và chỉnh sửa thông tin người dùng hiện tại
- 🔐 Xác thực bằng token, lưu trữ trong localStorage

### Sản Phẩm
- 📦 Tạo, cập nhật, xóa sản phẩm (dành cho Seller)
- 🖼️ Tải lên hình ảnh sản phẩm
- 📂 Phân loại sản phẩm theo danh mục
- 🔍 Tìm kiếm sản phẩm theo từ khóa
- 🌟 Hiển thị sản phẩm nổi bật và toàn bộ sản phẩm trong carousel có thể cuộn

### Giỏ Hàng
- ➕ Thêm sản phẩm vào giỏ hàng
- 🔄 Cập nhật số lượng sản phẩm
- ❌ Xóa sản phẩm hoặc xóa toàn bộ giỏ hàng
- 🛒 Chuyển hướng đến giỏ hàng sau khi thêm sản phẩm

### Đơn Hàng
- 🧾 Tạo đơn hàng từ giỏ hàng
- 🔄 Cập nhật trạng thái đơn hàng (dành cho Seller/Admin)
- 📜 Xem lịch sử đơn hàng

### Đánh Giá
- 🌟 Gửi đánh giá sản phẩm (1–5 sao, kèm bình luận)
- ✏️ Chỉnh sửa hoặc xóa đánh giá (nếu là người gửi)
- 📊 Hiển thị thống kê đánh giá (trung bình, phân bố sao)

### Seller
- 🏪 Quản lý sản phẩm của mình (tạo, cập nhật, xóa)
- 📦 Xem và xử lý đơn hàng liên quan

### Quản Trị Viên
- 👥 Quản lý danh sách người dùng (Seller và Customer)
- 📦 Quản lý toàn bộ sản phẩm và đơn hàng trong hệ thống
- 📊 Xem thống kê hệ thống (số lượng người dùng, đơn hàng, sản phẩm)

### Giao Diện
- 🕒 Hiển thị thời gian thực theo múi giờ Việt Nam (ICT, UTC+07:00) với định dạng tiếng Việt
- 🎠 Carousel sản phẩm mượt mà với nút điều hướng trái/phải
- 🖼️ Hero slider quảng cáo trên trang chủ
- 📱 Responsive design cho mobile, tablet, và desktop

---

## 🏗️ Cài Đặt

### Yêu Cầu
- Python 3.8+ (cho backend)
- Node.js 16+ (cho frontend)
- PostgreSQL hoặc SQLite (cho database)

### 1. Sao Chép Repository

```bash
git clone https://github.com/your-username/shopee-clone.git
cd shopee-clone
```

### 2. Cài Đặt Backend (Django)

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser # (Tùy chọn) Tạo tài khoản admin
python manage.py runserver
```

- Backend sẽ chạy tại: `http://localhost:8000`

### 3. Cài Đặt Frontend (React)

```bash
cd ../shopee_clone_frontend
npm install
npm start
```

- Frontend sẽ chạy tại: `http://localhost:3000`

### 4. Cấu Hình Môi Trường
- Backend: Tạo file `.env` trong thư mục `backend` với các biến:
  ```env
  SECRET_KEY=your_django_secret_key
  DEBUG=True
  DATABASE_URL=sqlite:///db.sqlite3 # hoặc postgresql://user:password@localhost:5432/dbname
  ```
- Frontend: Tạo file `.env` trong thư mục `shopee_clone_frontend`:
  ```env
  REACT_APP_API_URL=http://localhost:8000/api/
  ```

---

## 🗂️ Cấu Trúc Backend (Django)

### Models
- `User`: Người dùng (Seller hoặc Customer, tích hợp với Django auth)
- `Category`: Danh mục sản phẩm
- `Product`: Sản phẩm (tên, giá, mô tả, hình ảnh, danh mục, tồn kho)
- `Cart`: Giỏ hàng của người dùng
- `Order`: Đơn hàng
- `OrderItem`: Mục trong đơn hàng
- `Review`: Đánh giá sản phẩm

### Views
- **Auth**: `LoginView`, `RegisterView`, `LogoutView`, `CurrentUserView`
- **Products**: `CategoryViewSet`, `ProductViewSet`, `ProductImageUploadView`
- **Cart**: `CartViewSet`, `ClearCartView`
- **Orders**: `OrderViewSet`
- **Reviews**: `ReviewViewSet`
- **Admin**: `AdminStatsView`, `UserViewSet`

### Serializers
- `UserSerializer`, `CategorySerializer`, `ProductSerializer`, `CartSerializer`, `OrderSerializer`, `ReviewSerializer`

### API Endpoint
- Base URL: `http://localhost:8000/api/`

---

## 🧩 Cấu Trúc Frontend (React)

### Components
- **Common**: `Button`, `Card`, `Navbar`, `StarRating`
- **Auth**: `LoginForm`, `RegisterForm`
- **Products**: `ProductCard`, `ProductList`
- **Cart**: `CartItem`, `CartSummary`

### Pages
- **Auth**: `Login`, `Register` (lựa chọn vai trò Seller hoặc Customer)
- **Products**: `Home` (carousel sản phẩm, thời gian Việt Nam), `ProductDetail` (chi tiết sản phẩm, đánh giá)
- **Cart**: `Cart`, `Checkout`
- **Orders**: `OrderHistory`
- **Seller**: `SellerDashboard`, `ProductManagement`
- **Admin**: `AdminDashboard`

### Thư Viện
- **Axios**: Gửi request tới API
- **React Router**: Điều hướng giữa các trang
- **Context API**: Quản lý trạng thái giỏ hàng (`CartContext`) và xác thực (`AuthContext`)

---

## 📡 Một Số Endpoint Chính

### 🔐 Auth
- `POST /auth/register/`: Đăng ký (chọn vai trò: Seller hoặc Customer)
- `POST /auth/login/`: Đăng nhập
- `POST /auth/logout/`: Đăng xuất
- `GET /auth/user/`: Lấy thông tin người dùng hiện tại

### 🛍️ Products
- `GET /products/`: Lấy danh sách sản phẩm (hỗ trợ tìm kiếm qua query `?search=`)
- `POST /products/`: Tạo sản phẩm mới (dành cho Seller)
- `PUT /products/{id}/`: Cập nhật sản phẩm (dành cho Seller)
- `DELETE /products/{id}/`: Xóa sản phẩm (dành cho Seller)
- `POST /products/{id}/upload_image/`: Tải ảnh sản phẩm (dành cho Seller)

### 🛒 Cart
- `GET /cart/`: Lấy giỏ hàng của người dùng
- `POST /cart/`: Thêm sản phẩm vào giỏ
- `PUT /cart/{id}/`: Cập nhật số lượng sản phẩm
- `DELETE /cart/{id}/`: Xóa sản phẩm khỏi giỏ
- `DELETE /cart/clear/`: Xóa toàn bộ giỏ hàng

### 📦 Orders
- `POST /orders/`: Tạo đơn hàng từ giỏ
- `GET /orders/`: Lấy lịch sử đơn hàng
- `PUT /orders/{id}/status/`: Cập nhật trạng thái đơn hàng (Seller/Admin)

### 🌟 Reviews
- `GET /reviews/product/{id}/`: Lấy đánh giá của sản phẩm
- `POST /reviews/`: Gửi đánh giá (hỗ trợ khách không đăng nhập với `guest_name`)
- `PUT /reviews/{id}/`: Cập nhật đánh giá
- `DELETE /reviews/{id}/`: Xóa đánh giá

### ⚙️ Admin
- `GET /admin/stats/`: Thống kê hệ thống (số người dùng, đơn hàng, sản phẩm)
- `GET /admin/users/`: Danh sách người dùng
- `PUT /admin/users/{id}/`: Cập nhật thông tin người dùng
- `DELETE /admin/users/{id}/`: Xóa người dùng

---

## 🔐 Xác Thực

- **Backend**: Sử dụng Django Token Authentication
- **Frontend**: Lưu token trong `localStorage`
- **Axios Interceptor**:
  - Gắn token vào header của mỗi request
  - Xử lý lỗi `401` để chuyển hướng đến trang đăng nhập
- **Vai trò**: 
  - **Seller**: Quản lý sản phẩm và đơn hàng của mình
  - **Customer**: Mua sắm, đánh giá sản phẩm
  - **Admin**: Quản lý toàn hệ thống (người dùng, sản phẩm, đơn hàng)

---

## 🖼️ Giao Diện Trang Chủ

![Trang chủ Shopee Clone](assets/homepage.png)

- **Thời gian thực**: Hiển thị giờ Việt Nam (VD: "04:15 CH (UTC+07) VN vào Thứ Hai, 09 Tháng Sáu, 2025")
- **Carousel sản phẩm**: Hiển thị tất cả sản phẩm trong "Sản phẩm" và 3 sản phẩm nổi bật trong "Sản phẩm nổi bật"
- **Hero slider**: Quảng cáo với 3 hình ảnh, tự động chuyển đổi mỗi 5 giây
- **Responsive**: Tối ưu cho mobile, tablet, desktop

## 🖼️ Giao Diện Chi Tiết Sản Phẩm

![Chi tiết sản phẩm Shopee Clone](assets/product-detail.png)

- Hiển thị thông tin sản phẩm (tên, giá, danh mục, mô tả)
- Hiển thị đánh giá trung bình và phân bố sao
- Form gửi đánh giá (hỗ trợ khách không đăng nhập)
- Nút "Thêm vào giỏ hàng" với chuyển hướng đến giỏ hàng

---

## 🤝 Đóng Góp

1. Fork repository
2. Tạo branch mới: `git checkout -b feature/ten-tinh-nang`
3. Commit thay đổi: `git commit -m 'Thêm tính năng XYZ'`
4. Push lên branch: `git push origin feature/ten-tinh-nang`
5. Tạo Pull Request trên GitHub

---

## 📄 Giấy Phép

Dự án được cấp phép theo [MIT License](LICENSE). Bạn được tự do sử dụng, sao chép, sửa đổi và phân phối mã nguồn theo các điều khoản của giấy phép MIT.

---

## 📞 Liên Hệ

- Email: your-email@example.com
- GitHub: [your-username](https://github.com/your-username)