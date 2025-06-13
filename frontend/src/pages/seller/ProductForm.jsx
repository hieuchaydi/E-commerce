import React, { useState, useEffect } from 'react';
import { productsAPI } from '../../api/api';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import './ProductForm.css';

const ProductForm = () => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category_id: '',
    image: null,
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productsAPI.getCategories();
        setCategories(response.data);
      } catch (err) {
        setError('Không thể tải danh mục');
        console.error('Fetch categories error:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setFormData({ ...formData, image: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const price = parseFloat(formData.price);
    const quantity = parseInt(formData.quantity, 10);
    const category_id = parseInt(formData.category_id, 10);

    if (!formData.name || !formData.description || isNaN(price) || price <= 0 || isNaN(quantity) || quantity < 0 || isNaN(category_id)) {
      setError('Vui lòng điền đầy đủ và đúng thông tin');
      return;
    }

    try {
      const data = {
        name: formData.name,
        description: formData.description,
        price: price,
        quantity: quantity,
        category_id: category_id,
        image: formData.image,
      };
      await productsAPI.createProduct(data);
      navigate('/seller/products');
    } catch (err) {
      console.error('Create product error:', err.response?.data);
      setError(err.message || 'Thêm sản phẩm thất bại');
    }
  };

  return (
    <div className="product-form">
      <h2>Thêm sản phẩm mới</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Tên sản phẩm</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Tên sản phẩm"
            required
          />
        </div>
        <div>
          <label>Mô tả</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Mô tả"
            required
          />
        </div>
        <div>
          <label>Giá</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="Giá"
            step="0.01"
            required
          />
        </div>
        <div>
          <label>Số lượng</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Số lượng"
            required
          />
        </div>
        <div>
          <label>Danh mục</label>
          <select name="category_id" value={formData.category_id} onChange={handleChange} required>
            <option value="">Chọn danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Ảnh sản phẩm</label>
          <input type="file" name="image" onChange={handleChange} />
        </div>
        <Button type="submit">Thêm sản phẩm</Button>
      </form>
    </div>
  );
};

export default ProductForm;