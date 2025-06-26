# E-commerce

**E-commerce project** with **Frontend (ReactJS)** and **Backend (Django)**.

---

## ⚙️ Main Features

### Frontend (ReactJS)
- User registration, login, and logout
- Product catalog and product details
- Product search
- Add/edit/remove products in the cart
- Order checkout
- Modern, responsive UI

### Backend (Django)
- RESTful API for users, products, and orders
- Authentication with JWT
- User role management (user/admin)
- Order management
- Product image upload

---

## 🚀 Installation

### 1. Backend

```bash
cd backend
python -m venv env
source env/bin/activate      # Windows: .\env\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

---

## 🔐 Environment

Create a `.env` file for both frontend and backend:

- `REACT_APP_API_URL=http://localhost:8000/api/`
- `SECRET_KEY=...`
- `DEBUG=True`

---

## 📌 Notes

- Backend uses Django REST Framework.
- Frontend can be deployed on Vercel or Netlify.
- Backend can be deployed on Render, Railway, or VPS.

---

## 📧 Contact

Nguyễn Văn Hiếu - [GitHub](https://github.com/Hieuchaydi) 🛒E-commerce Website

e-commerce-website is an e-commerce project that replicates the e-commerce-website platform, built with **Django** for the backend and **React** for the frontend. The project supports user authentication with two roles (Seller and Customer), product management, shopping cart, orders, product reviews, and admin functionalities.

---

## 🚀 Main Features

### User
- ✅ **Register** with two roles: **Seller** or **Customer**
- ✅ Login, logout
- 👤 View and edit current user information
- 🔐 Token-based authentication, stored in localStorage

### Product
- 📦 Create, update, delete products (for Sellers)
- 🖼️ Upload product images
- 📂 Categorize products by category
- 🔍 Search products by keyword
- 🌟 Display featured and all products in a scrollable carousel

### Shopping Cart
- ➕ Add products to cart
- 🔄 Update product quantity
- ❌ Remove individual products or clear entire cart
- 🛒 Redirect to cart after adding product

### Orders
- 🧾 Create order from cart
- 🔄 Update order status (for Seller/Admin)
- 📜 View order history

### Reviews
- 🌟 Submit product review (1–5 stars, with comments)
- ✏️ Edit or delete reviews (if you are the author)
- 📊 Display review statistics (average, star distribution)

### Seller
- 🏪 Manage own products (create, update, delete)
- 📦 View and process related orders

### Admin
- 👥 Manage user list (Sellers and Customers)
- 📦 Manage all products and orders in the system
- 📊 View system statistics (number of users, orders, products)

### UI
- 🕒 Display real-time Vietnam time (ICT, UTC+07:00) in Vietnamese format
- 🎠 Smooth product carousel with left/right navigation buttons
- 🖼️ Hero slider advertisements on the homepage
- 📱 Responsive design for mobile, tablet, and desktop

---

## 🏗️ Setup

### Requirements
- Python 3.8+ (for backend)
- Node.js 16+ (for frontend)
- PostgreSQL or SQLite (for database)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/shopee-clone.git
cd shopee-clone
```

### 2. Backend Setup (Django)

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser # (Optional) Create admin account
python manage.py runserver
```

- Backend will run at: `http://localhost:8000`

### 3. Frontend Setup (React)

```bash
cd ../shopee_clone_frontend
npm install
npm start
```

- Frontend will run at: `http://localhost:3000`

### 4. Environment Configuration
- Backend: Create a `.env` file in the `backend` folder with the following variables:
  ```env
  SECRET_KEY=your_django_secret_key
  DEBUG=True
  DATABASE_URL=sqlite:///db.sqlite3 # or postgresql://user:password@localhost:5432/dbname
  ```
- Frontend: Create a `.env` file in `shopee_clone_frontend`:
  ```env
  REACT_APP_API_URL=http://localhost:8000/api/
  ```

---

## 🗂️ Backend Structure (Django)

### Models
- `User`: User (Seller or Customer, integrated with Django auth)
- `Category`: Product category
- `Product`: Product (name, price, description, image, category, stock)
- `Cart`: User's shopping cart
- `Order`: Order
- `OrderItem`: Item in an order
- `Review`: Product review

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

## 🧩 Frontend Structure (React)

### Components
- **Common**: `Button`, `Card`, `Navbar`, `StarRating`
- **Auth**: `LoginForm`, `RegisterForm`
- **Products**: `ProductCard`, `ProductList`
- **Cart**: `CartItem`, `CartSummary`

### Pages
- **Auth**: `Login`, `Register` (choose Seller or Customer role)
- **Products**: `Home` (product carousel, Vietnam time), `ProductDetail` (product details, reviews)
- **Cart**: `Cart`, `Checkout`
- **Orders**: `OrderHistory`
- **Seller**: `SellerDashboard`, `ProductManagement`
- **Admin**: `AdminDashboard`

### Libraries
- **Axios**: For API requests
- **React Router**: For page navigation
- **Context API**: Manage cart state (`CartContext`) and authentication (`AuthContext`)

---

## 📡 Key API Endpoints

### 🔐 Auth
- `POST /auth/register/`: Register (choose role: Seller or Customer)
- `POST /auth/login/`: Login
- `POST /auth/logout/`: Logout
- `GET /auth/user/`: Get current user info

### 🛍️ Products
- `GET /products/`: Get product list (supports searching with `?search=`)
- `POST /products/`: Create new product (for Sellers)
- `PUT /products/{id}/`: Update product (for Sellers)
- `DELETE /products/{id}/`: Delete product (for Sellers)
- `POST /products/{id}/upload_image/`: Upload product image (for Sellers)

### 🛒 Cart
- `GET /cart/`: Get user's cart
- `POST /cart/`: Add product to cart
- `PUT /cart/{id}/`: Update product quantity in cart
- `DELETE /cart/{id}/`: Remove product from cart
- `DELETE /cart/clear/`: Clear entire cart

### 📦 Orders
- `POST /orders/`: Create order from cart
- `GET /orders/`: Get order history
- `PUT /orders/{id}/status/`: Update order status (Seller/Admin)

### 🌟 Reviews
- `GET /reviews/product/{id}/`: Get product reviews
- `POST /reviews/`: Submit review (supports guest review with `guest_name`)
- `PUT /reviews/{id}/`: Update review
- `DELETE /reviews/{id}/`: Delete review

### ⚙️ Admin
- `GET /admin/stats/`: System statistics (users, orders, products)
- `GET /admin/users/`: List of users
- `PUT /admin/users/{id}/`: Update user info
- `DELETE /admin/users/{id}/`: Delete user

---

## 🔐 Authentication

- **Backend**: Uses Django Token Authentication
- **Frontend**: Stores token in `localStorage`
- **Axios Interceptor**:
  - Attaches token to every request header
  - Handles `401` errors by redirecting to login page
- **Roles**:
  - **Seller**: Manage own products and orders
  - **Customer**: Shop and review products
  - **Admin**: Manage the entire system (users, products, orders)

---

## 🖼️ Homepage UI

![Shopee Clone Homepage](assets/home.png)

- **Real-time clock**: Displays Vietnam time (e.g., "04:15 PM (UTC+07) VN on Monday, June 9th, 2025")
- **Product carousel**: Shows all products in "Products" and 3 featured products in "Featured Products"
- **Hero slider**: Rotates 3 advertisement images automatically every 5 seconds
- **Responsive**: Optimized for mobile, tablet, desktop

## 🖼️ Product Detail UI

![Shopee Clone voucher](assets/add-voucher.png)

- Shows product information (name, price, category, description)
- Displays average rating and star distribution
- Review submission form (supports guest review)
- "Add to Cart" button with redirect to cart

---
![Shopee Clone create voucher](assets/create-voucher.png)

## 🤝 Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/feature-name`
3. Commit your changes: `git commit -m 'Add feature XYZ'`
4. Push to your branch: `git push origin feature/feature-name`
5. Create a Pull Request on GitHub

---

---
![chat with seller](assets/chat-with-seller.png)

## Chat with seller


---

## 📄 License

This project is licensed under the [MIT License](LICENSE). You are free to use, copy, modify, and distribute this code under the terms of the MIT license.

---

# 📚 Project Documentation

## Python
- [Official Python Documentation](https://docs.python.org/3/)
- [Python Tutorial (W3Schools)](https://www.w3schools.com/python/)
- [Real Python Tutorials](https://realpython.com/)

## Django
- [Official Django Documentation](https://docs.djangoproject.com/en/stable/)
- [Django REST framework](https://www.django-rest-framework.org/)
- [Django Girls Tutorial](https://tutorial.djangogirls.org/)

## React
- [Official React Documentation](https://react.dev/learn)
- [React Tutorial (W3Schools)](https://www.w3schools.com/react/)
- [React Router Docs](https://reactrouter.com/en/main)

## CSS
- [MDN CSS Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference)
- [CSS Tricks](https://css-tricks.com/)
- [W3Schools CSS Tutorial](https://www.w3schools.com/css/)

## TailwindCSS
- [Official TailwindCSS Documentation](https://tailwindcss.com/docs/)
- [Tailwind Play (Playground)](https://play.tailwindcss.com/)
- [Tailwind Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)

---
# Sending Email with Gmail App Password in Django

This guide explains how to configure Django to send emails using Gmail’s SMTP server with a 16-character App Password.

## 1. Enable 2-Step Verification on Your Google Account

You **must** enable 2-Step Verification on your Google account before using App Passwords.

- Visit [Google Account Security](https://myaccount.google.com/security).
- Under **How you sign in to Google**, click **2-Step Verification** and follow the steps to enable it.

## 2. Generate a 16-Character App Password

1. After enabling 2-Step Verification, return to [Google Account Security](https://myaccount.google.com/security).
2. In the **2-Step Verification** section, scroll down and click **App Passwords**.
3. Sign in again if prompted.
4. Under **Select app**, choose **Mail** (or “Other” and type a name, e.g., “Django”).
5. Under **Select device**, choose your device or “Other”.
6. Click **Generate**.
7. Copy the 16-character password shown (e.g., `imcb kuss kuca abur`). You will **only see it once**.

## 3. Gmail SMTP Settings Example (`settings.py`)

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'hieu12@gmail.com'           # Your Gmail address
EMAIL_HOST_PASSWORD = 'imcb kuss kuca abur'    # Your 16-character app password
```

> **Note:** Replace `hieu12@gmail.com` and `imcb kuss kuca abur` with your own Gmail address and App Password and this is my example.

> **Never share your app password publicly. Store it securely.**

## 4. Usage Example in Django

You can now send emails from your Django application:

```python
from django.core.mail import send_mail

send_mail(
    'Subject here',
    'Here is the message.',
    'hieu12@gmail.com',  # From email
    ['recipient@example.com'],  # To email
    fail_silently=False,
)
```

## 5. Notes

- **App Passwords** are not your normal Google password; use the 16-character code.
- If you lose your app password or need to revoke it, return to the App Passwords page to manage or generate a new one.
- If you use environment variables or a `.env` file, do **not** hardcode sensitive information in your codebase.

## References

- [Google: Sign in using App Passwords](https://support.google.com/accounts/answer/185833)
- [Django Email Documentation](https://docs.djangoproject.com/en/stable/topics/email/)
> Thank you for checking out my project
