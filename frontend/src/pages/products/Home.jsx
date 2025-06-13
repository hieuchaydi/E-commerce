import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productsAPI, getMediaUrl } from '../../api/api';
import { useCart } from '../../context/CartContext';
import './Home.css';

const CurrentDateTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDateTime = (date) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh',
    };
    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Ho_Chi_Minh',
    };
    const dateString = date.toLocaleDateString('vi-VN', options);
    const timeString = date.toLocaleTimeString('vi-VN', timeOptions).replace(' ', '');
    return `${timeString} (UTC+07) VN vào ${dateString}`;
  };

  return <div className="current-date-time">{formatDateTime(currentTime)}</div>;
};

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const allProductsRef = useRef(null);
  const featuredRef = useRef(null);
  const sliderRef = useRef(null);

  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    search: searchParams.get('search') || '',
    sortBy: ''
  });

  const sliderImages = [
    '/media/products/man.png',
    '/media/products/OSK.jpg',
    '/media/products/thitlonluoc.jpg',
  ];

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Tạo đối tượng params từ filters
        const params = {
          search: filters.search || undefined,
          category: filters.category || undefined,
          min_price: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
          max_price: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
          min_rating: filters.minRating ? parseFloat(filters.minRating) : undefined,
          ordering: filters.sortBy || undefined,
        };

        // Loại bỏ các tham số undefined
        const filteredParams = Object.fromEntries(
          Object.entries(params).filter(([_, value]) => value !== undefined)
        );

        console.log('Filtered params:', filteredParams); // Debug

        // Gọi API với các tham số đã lọc
        const response = await productsAPI.getProducts(filteredParams);
        const productsData = response.data.results || response.data || [];

        // Sắp xếp sản phẩm nổi bật theo số lượng đã bán
        const featured = productsData
          .sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0))
          .slice(0, 6);

        // Cập nhật trạng thái
        setProducts(productsData);
        setFeaturedProducts(featured);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi tải sản phẩm');
        console.error('Lỗi tải sản phẩm:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    const autoSlide = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);

    return () => clearInterval(autoSlide);
  }, [filters, sliderImages.length]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'minRating' && value && (value < 1 || value > 5)) {
      return;
    }
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

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

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const scroll = debounce((ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }, 100);

  const renderProductCard = (product) => {
    const averageRating = product.avg_rating || null;
    const productImage = product.image
      ? getMediaUrl(product.image)
      : getMediaUrl('/media/products/thitlonluoc.jpg');

    const handleAddToCart = async () => {
      try {
        await addToCart(product.id, 1);
        navigate('/cart');
      } catch (error) {
        console.error('Failed to add to cart:', error);
        setError('Thêm vào giỏ hàng thất bại. Vui lòng thử lại.');
      }
    };

    const handleProductClick = () => {
      navigate(`/products/${product.id}`, { replace: false });
    };

    return (
      <div className="product-card snap-start" key={product.id}>
        <div className="relative w-full aspect-square">
          <img
            src={productImage}
            alt={product.name || 'Sản phẩm'}
            className="product-image absolute inset-0 w-full h-full object-cover rounded-md"
            onClick={handleProductClick}
            loading="lazy"
          />
        </div>
        <div className="product-info mt-2">
          <h3 className="product-name" onClick={handleProductClick}>
            {product.name}
          </h3>
          {averageRating && <div className="rating">Đánh giá: {averageRating.toFixed(1)}★</div>}
          {product.sold_count !== undefined && (
            <div className="sold">Đã bán: {product.sold_count}</div>
          )}
          <div className="price">${(product.price || 0).toFixed(2)}</div>
          <button
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={loading}
          >
            {loading ? 'Đang tải...' : 'Thêm vào giỏ'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="home-page">
      <CurrentDateTime />
      <div className="hero-slider" ref={sliderRef}>
        <div className="slider-content" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {sliderImages.map((image, index) => (
            <div
              className="slide relative w-full aspect-[4/3]"
              key={index}
            >
              <img
                src={getMediaUrl(image)}
                alt={`Slide ${index}`}
                className="slide-image w-full h-full object-cover"
                loading="lazy"
              />
              <div className="slide-overlay"></div>
            </div>
          ))}
        </div>
        <div className="slider-dots">
          {sliderImages.map((_, index) => (
            <span
              key={index}
              className={`dot ${currentSlide === index ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              role="button"
              aria-label={`Chuyển đến slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="filters">
        <div className="filter-group-left">
          <input
            type="text"
            name="search"
            placeholder="Tìm kiếm sản phẩm..."
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
        </div>
        <div className="filter-group-right">
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
            <option value="price">Giá: Thấp đến Cao</option>
            <option value="-price">Giá: Cao đến Thấp</option>
            <option value="created_at">Mới nhất</option>
            <option value="-created_at">Cũ nhất</option>
            <option value="sold_count">Bán chạy nhất</option>
          </select>
          <button onClick={handleResetFilters} className="reset-button">
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {[
        { title: 'Sản phẩm', products: products, ref: allProductsRef },
        { title: 'Sản phẩm nổi bật', products: featuredProducts, ref: featuredRef },
      ].map((section, index) => (
        <div className="section" key={index}>
          <h2 className="section-title">{section.title}</h2>
          <div className="carousel-wrapper">
            <button
              className="carousel-btn prev"
              onClick={() => scroll(section.ref, 'left')}
              aria-label={`Trước ${section.title}`}
            >
              ‹
            </button>
            <div className="carousel-track" ref={section.ref} role="region" aria-label={`Carousel ${section.title}`}>
              {loading ? (
                Array(6).fill().map((_, i) => (
                  <div className="product-card snap-start placeholder" key={i}>
                    <div className="product-image bg-gray-200 animate-pulse"></div>
                    <div className="product-info">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
                    </div>
                  </div>
                ))
              ) : error ? (
                <div className="error-state">{error}</div>
              ) : section.products.length === 0 ? (
                <div className="no-results">Không có sản phẩm</div>
              ) : (
                section.products.map(renderProductCard)
              )}
            </div>
            <button
              className="carousel-btn next"
              onClick={() => scroll(section.ref, 'right')}
              aria-label={`Tiếp theo ${section.title}`}
            >
              ›
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Home;