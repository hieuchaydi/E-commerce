import axios from 'axios';

const API_URL = 'http://localhost:8000/api';
const MEDIA_URL = 'http://localhost:8000/media';
export const getMediaUrl = (path) => {
  if (!path) return '/images/placeholder.jpg';
  if (path.startsWith('http') || path.startsWith('//')) return path;
  if (path.startsWith('/')) return `${API_URL}${path}`;
  return `${MEDIA_URL}/${path}`;
};

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRedirecting = false;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user_id');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Token ${token}`;
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_id');
    delete api.defaults.headers.common['Authorization'];
  }
  isRedirecting = false;
};

export const authAPI = {
  login: async (credentials) => {
    const res = await api.post('/auth/login/', credentials);
    const { token, role, user_id } = res.data;
    setAuthToken(token);
    localStorage.setItem('role', role);
    localStorage.setItem('user_id', user_id);
    console.log('Logged in:', { role, user_id });
    return res;
  },
  register: async (data) => {
    const { password2, ...userData } = data;
    const res = await api.post('/auth/register/', userData);
    const { token, user } = res.data;
    setAuthToken(token);
    localStorage.setItem('role', user.role);
    localStorage.setItem('user_id', user.id);
    console.log('Registered:', { role: user.role, user_id: user.id });
    return res;
  },
  logout: async () => {
    try {
      const res = await api.post('/auth/logout/');
      setAuthToken(null);
      console.log('Logged out');
      return res;
    } catch (error) {
      setAuthToken(null);
      throw error;
    }
  },
  getCurrentUser: () => api.get('/auth/user/'),
  forgotPassword: (data) => api.post('/auth/forgot-password/', data),
  resetPassword: (data) => api.post('/auth/reset-password/', data),
  updateUser: async (id, data) => {
    try {
      const res = await api.patch(`/auth/user/`, data);
      return res;
    } catch (err) {
      console.error('Update user failed:', err.response?.data || err.message);
      throw err;
    }
  },
  changePassword: async (data) => {
    try {
      const res = await api.post('/auth/change-password/', data);
      return res;
    } catch (err) {
      console.error('Change password failed:', err.response?.data || err.message);
      throw err;
    }
  },
};

export const productsAPI = {
  getProducts: (params = {}) => api.get('/products/', { params }),
  getProduct: (id) => api.get(`/products/${id}/`),
  createProduct: async (data) => {
    const formData = new FormData();
    for (const key in data) {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    }
    try {
      const res = await api.post('/products/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Thêm sản phẩm thất bại');
    }
  },
  updateProduct: async (id, data) => {
    const formData = new FormData();
    for (const key in data) {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    }
    try {
      const res = await api.patch(`/products/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Cập nhật sản phẩm thất bại');
    }
  },
  deleteProduct: (id) => api.delete(`/products/${id}/`),
  getCategories: () => api.get('/categories/'),
  getUser: (id) => api.get(`/users/${id}/`),
};

export const cartAPI = {
  getCart: () => api.get('/cart/'),
  addToCart: (productId, quantity = 1) =>
    api.post('/cart/', { product_id: productId, quantity }),
  updateCartItem: (id, quantity) =>
    api.patch(`/cart/${id}/`, { quantity }),
  removeFromCart: (id) => api.delete(`/cart/${id}/`),
  clearCart: () => api.delete('/cart/clear/'),
};

export const ordersAPI = {
  createOrder: async (data) => {
    try {
      const res = await api.post('/orders/', data);
      return res.data;
    } catch (err) {
      console.error('Create order failed:', err.response?.data || err.message);
      throw err;
    }
  },
  getOrders: async (params = {}) => {
    try {
      const res = await api.get('/orders/', { params });
      return res.data.results || res.data; // Xử lý cả trường hợp có pagination
    } catch (err) {
      console.error('Fetch orders failed:', err.response?.data || err.message);
      throw err;
    }
  },
  getOrder: async (id) => {
    try {
      const res = await api.get(`/orders/${id}/`);
      return res.data;
    } catch (err) {
      console.error('Fetch order failed:', err.response?.data || err.message);
      throw err;
    }
  },
  updateOrderStatus: async (id, data) => {
    try {
      const res = await api.patch(`/orders/${id}/status/`, data);
      return res.data;
    } catch (err) {
      console.error('Update order status failed:', err.response?.data || err.message);
      throw err;
    }
  },
  updatePaymentStatus: async (id, status) => {
    try {
      const res = await api.patch(`/orders/${id}/payment/`, { status });
      return res.data;
    } catch (err) {
      console.error('Update payment status failed:', err.response?.data || err.message);
      throw err;
    }
  },
  validateDiscountCode: async (code, orderTotal) => {
    try {
      const res = await api.post('/discounts/validate/', { code, order_total: orderTotal });
      const discountAmount = Number(res.data.discount_amount) || 0;
      if (isNaN(discountAmount)) {
        throw new Error('Số tiền giảm giá không hợp lệ từ server');
      }
      return { ...res.data, discount_amount: discountAmount };
    } catch (err) {
      console.error('Discount validation error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.detail || 'Mã giảm giá không hợp lệ');
    }
  },
};

export const reviewsAPI = {
  getProductReviews: (productId) => api.get(`/products/${productId}/reviews/`),
  createReview: (productId, data) => api.post(`/products/${productId}/reviews/`, data),
  updateReview: (id, data) => api.patch(`/reviews/${id}/`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}/`),
  getMyReviews: () => api.get('/reviews/my/'),
};

export const adminAPI = {
  getUsers: (params = {}) => api.get('/admin/users/', { params }),
  getUser: (id) => api.get(`/admin/users/${id}/`),
  createUser: (data) => api.post('/admin/users/', data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}/`),
  getStats: () => api.get('/admin/stats/'),
  getOrders: (params = {}) => api.get('/orders/', { params }),
  updateOrder: (id, data) => api.patch(`/orders/${id}/`, data),
};

export default api;