import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productsAPI } from '../../api/api';
import './ProductForm.css';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category_id: '',
    product_type: 'other',
    image: null,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const productTypes = [
    { value: 'electronics', label: 'Điện tử' },
    { value: 'clothing', label: 'Quần áo' },
    { value: 'food', label: 'Thực phẩm' },
    { value: 'furniture', label: 'Nội thất' },
    { value: 'other', label: 'Khác' },
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productsAPI.getCategories();
        console.log('Raw response from getCategories:', response); // Log toàn bộ response
        if (Array.isArray(response)) {
          setCategories(response); // Nếu response trực tiếp là mảng
        } else if (response?.data && Array.isArray(response.data)) {
          setCategories(response.data); // Nếu response chứa data là mảng
        } else {
          console.error('Invalid response structure:', response);
          throw new Error('Dữ liệu danh mục không phải là mảng hoặc không chứa results');
        }
      } catch (err) {
        console.error('Lỗi tải danh mục:', err); // Log chi tiết lỗi
        setErrors({ detail: `Lỗi tải danh mục: ${err.message}` });
      }
    };

    const fetchProduct = async () => {
      if (id) {
        try {
          const response = await productsAPI.getProduct(id);
          setFormData({
            name: response.data.name,
            description: response.data.description,
            price: response.data.price,
            quantity: response.data.quantity,
            category_id: response.data.category?.id || '',
            product_type: response.data.product_type,
            image: null,
          });
        } catch (err) {
          console.error('Lỗi tải sản phẩm:', err);
          setErrors({ detail: 'Lỗi tải sản phẩm' });
        }
      }
    };

    fetchCategories();
    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    if (!formData.category_id) {
      setErrors({ category_id: 'Vui lòng chọn danh mục' });
      setLoading(false);
      return;
    }

    try {
      if (id) {
        await productsAPI.updateProduct(id, formData);
      } else {
        await productsAPI.createProduct(formData);
      }
      navigate('/seller/products');
    } catch (err) {
      console.error('Lỗi khi lưu sản phẩm:', err);
      setErrors(err.response?.data || { detail: 'Lỗi khi lưu sản phẩm' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form-container">
      <h2>{id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
      {errors.detail && <div className="error">{errors.detail}</div>}
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label>Tên sản phẩm</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          {errors.name && <div className="error">{errors.name}</div>}
        </div>
        <div className="form-group">
          <label>Mô tả</label>
          <textarea name="description" value={formData.description} onChange={handleChange} required />
          {errors.description && <div className="error">{errors.description}</div>}
        </div>
        <div className="form-group">
          <label>Giá</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
          {errors.price && <div className="error">{errors.price}</div>}
        </div>
        <div className="form-group">
          <label>Số lượng</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="0"
            required
          />
          {errors.quantity && <div className="error">{errors.quantity}</div>}
        </div>
        <div className="form-group">
          <label>Danh mục</label>
          <select name="category_id" value={formData.category_id} onChange={handleChange} required>
            <option value="">Chọn danh mục</option>
            {categories.length > 0 ? (
              categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            ) : (
              <option value="" disabled>Không có danh mục</option>
            )}
          </select>
          {errors.category_id && <div className="error">{errors.category_id}</div>}
        </div>
        <div className="form-group">
          <label>Loại sản phẩm</label>
          <select name="product_type" value={formData.product_type} onChange={handleChange} required>
            {productTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.product_type && <div className="error">{errors.product_type}</div>}
        </div>
        <div className="form-group">
          <label>Hình ảnh</label>
          <input type="file" name="image" onChange={handleChange} accept="image/*" />
          {errors.image && <div className="error">{errors.image}</div>}
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Đang lưu...' : id ? 'Cập nhật' : 'Thêm sản phẩm'}
        </button>
      </form>
    </div>
  );
};

export default ProductForm;