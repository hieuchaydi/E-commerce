import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import ProductCard from './ProductCard';
import { productsAPI } from '../../api'; // Import API từ api.jsx
import './ProductList.css';

const ProductList = () => {
  // State cho danh sách sản phẩm và trạng thái
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State cho bộ lọc và sắp xếp
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    search: '',
    sortBy: ''
  });

  // Fetch danh mục khi component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productsAPI.getCategories();
        setCategories(response.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch sản phẩm khi filters thay đổi
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
          ordering: filters.sortBy
        });
        setProducts(response.data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [filters]);

  // Handle thay đổi bộ lọc
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Handle reset bộ lọc
  const handleResetFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      search: '',
      sortBy: ''
    });
  };

  if (loading) return <div className="loading">Loading products...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  if (!products.length) return <div className="no-products">No products found</div>;

  return (
    <div className="product-list-container">
      <div className="filters">
        <input
          type="text"
          name="search"
          placeholder="Search products..."
          value={filters.search}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="minPrice"
          placeholder="Min Price"
          value={filters.minPrice}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <input
          type="number"
          name="maxPrice"
          placeholder="Max Price"
          value={filters.maxPrice}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <input
          type="number"
          name="minRating"
          placeholder="Min Rating (1-5)"
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
          <option value="">Sort By</option>
          <option value="price">Price: Low to High</option>
          <option value="-price">Price: High to Low</option>
          <option value="created_at">Newest</option>
          <option value="-created_at">Oldest</option>
          <option value="sold_count">Most Popular</option>
        </select>
        <button onClick={handleResetFilters} className="reset-button">
          Reset Filters
        </button>
      </div>
      <div className="product-list">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
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
      sold_count: PropTypes.number
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