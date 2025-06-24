import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import ProductCard from './ProductCard';
import { productsAPI } from '../../api/api';
import './ProductList.css';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState(null);

  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    search: '',
    seller: '',
    sortBy: ''
  });

  const location = useLocation();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productsAPI.getCategories();
        setCategories(response.data || response);
      } catch (err) {
        console.error('Lỗi tải danh mục:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const seller = params.get('seller') || '';
    setFilters((prev) => ({ ...prev, seller }));
    setPage(1);
  }, [location.search]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await productsAPI.getProducts({
          category: filters.category,
          min_price: filters.minPrice,
          max_price: filters.maxPrice,
          min_rating: filters.minRating,
          search: filters.search,
          seller: filters.seller,
          ordering: filters.sortBy,
          page
        });
        setProducts((prev) =>
          page === 1 ? (response.results || response) : [...prev, ...(response.results || response)]
        );
        setNextPage(response.next || null);
        setError(null);
      } catch (err) {
        setError(filters.seller ? `Không tìm thấy sản phẩm nào từ người bán "${filters.seller}".` : 'Lỗi tải sản phẩm.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [filters, page]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      search: '',
      seller: '',
      sortBy: ''
    });
    setPage(1);
  };

  const handleLoadMore = () => {
    if (nextPage) setPage(page + 1);
  };

  if (loading && page === 1) return <div className="loading">Đang tải sản phẩm...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!products.length) return <div className="no-products">Không tìm thấy sản phẩm nào</div>;

  return (
    <div className="product-list-container">
      <div className="filters">
        <input
          type="text"
          name="search"
          placeholder="Tìm kiếm sản phẩm..."
          value={filters.search}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <input
          type="text"
          name="seller"
          placeholder="Tìm kiếm theo tên người bán..."
          value={filters.seller}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="minPrice"
          placeholder="Giá tối thiểu"
          value={filters.minPrice}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <input
          type="number"
          name="maxPrice"
          placeholder="Giá tối đa"
          value={filters.maxPrice}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <input
          type="number"
          name="minRating"
          placeholder="Đánh giá tối thiểu (1-5)"
          value={filters.minRating}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <select
          name="sortBy"
          value={filters.sortBy}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">Sắp xếp theo</option>
          <option value="price">Giá: Thấp đến cao</option>
          <option value="-price">Giá: Cao đến thấp</option>
          <option value="created_at">Mới nhất</option>
          <option value="-created_at">Cũ nhất</option>
          <option value="sold_count">Phổ biến nhất</option>
        </select>
        <button onClick={handleResetFilters} className="reset-button">
          Xóa bộ lọc
        </button>
      </div>
      <div className="product-list">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {nextPage && (
        <button onClick={handleLoadMore} className="load-more-button">
          Tải thêm
        </button>
      )}
      {loading && page > 1 && <div className="loading">Đang tải thêm...</div>}
    </div>
  );
};

ProductList.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      image: PropTypes.string,
      avg_rating: PropTypes.number,
      sold_count: PropTypes.number,
      seller: PropTypes.shape({
        username: PropTypes.string.isRequired
      })
    })
  ),
  loading: PropTypes.bool,
  error: PropTypes.object
};

ProductList.defaultProps = {
  products: [],
  loading: false,
  error: null
};

export default ProductList;