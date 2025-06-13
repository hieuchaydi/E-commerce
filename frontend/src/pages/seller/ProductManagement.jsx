import React, { useState, useEffect, useCallback } from 'react';
import { productsAPI, getMediaUrl } from '../../api/api';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import ImageUpload from '../../components/products/ImageUpload';
import './ProductManagement.css';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productsAPI.getProducts({ page: 1, page_size: 10 });
      const productsData = response.data.results || response.data || [];
      console.log('Product Management - Products:', productsData);
      setProducts(productsData);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Không thể tải sản phẩm';
      console.error('Fetch products error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (productId) => {
    setLoading(true);
    setError(null);
    try {
      await productsAPI.deleteProduct(productId);
      setProducts(products.filter((product) => product.id !== productId));
      setDeleteConfirm(null);
      setSuccessMessage('Sản phẩm đã được xóa thành công');
      setTimeout(() => setSuccessMessage(null), 3000);
      console.log('Deleted product:', productId);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Lỗi khi xóa sản phẩm';
      console.error('Delete product error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-management">
      <div className="page-header">
        <h2>Quản lý sản phẩm</h2>
        <Link to="/seller/products/new">
          <Button variant="contained" color="success">Thêm sản phẩm</Button>
        </Link>
      </div>

      {successMessage && <div className="success-message">{successMessage}</div>}
      {error && <div className="error-message">{error}</div>}

      {loading && <div className="loading">Đang tải sản phẩm...</div>}

      {!loading && (
        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th className="id-column">ID</th>
                <th>Ảnh</th>
                <th>Tên</th>
                <th>Giá</th>
                <th>Số lượng</th>
                <th>Danh mục</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-products">
                    Không tìm thấy sản phẩm
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="id-column" data-label="ID">{product.id}</td>
                    <td data-label="Ảnh">
                      {product.image ? (
                        <img
                          src={getMediaUrl(product.image)}
                          alt={product.name || 'Ảnh sản phẩm'}
                          className="product-image"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = '/images/placeholder.jpg';
                            e.target.className = 'product-image error';
                          }}
                          style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                        />
                      ) : (
                        <ImageUpload
                          productId={product.id}
                          onUploadSuccess={fetchProducts}
                        />
                      )}
                    </td>
                    <td data-label="Tên">
                      <Link to={`/products/${product.id}`}>{product.name}</Link>
                    </td>
                    <td data-label="Giá">${(parseFloat(product.price) || 0).toFixed(2)}</td>
                    <td data-label="Số lượng">{product.quantity || 0}</td>
                    <td data-label="Danh mục">{product.category?.name || 'Chưa phân loại'}</td>
                    <td data-label="Hành động" className="actions">
                      <Link to={`/seller/products/edit/${product.id}`}>
                        <Button size="small" color="primary">Sửa</Button>
                      </Link>
                      {deleteConfirm === product.id ? (
                        <>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => handleDelete(product.id)}
                            disabled={loading}
                          >
                            Xác nhận
                          </Button>
                          <Button
                            size="small"
                            onClick={() => setDeleteConfirm(null)}
                            disabled={loading}
                          >
                            Hủy
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => setDeleteConfirm(product.id)}
                          disabled={loading}
                        >
                          Xóa
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;