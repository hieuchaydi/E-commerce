import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productsAPI, getMediaUrl } from '../../api/api';
import { useCart } from '../../context/CartContext';
import Button from '../../components/common/Button';
import './Home.css';

const CurrentDateTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDateTime = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Ho_Chi_Minh' };
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
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const allProductsRef = useRef(null);
  const featuredRef = useRef(null);
  const recentRef = useRef(null);

  const productTypes = [
    { value: '', label: 'Tất cả loại sản phẩm' },
    { value: 'electronics', label: 'Điện tử' },
    { value: 'clothing', label: 'Quần áo' },
    { value: 'food', label: 'Thực phẩm' },
    { value: 'furniture', label: 'Nội thất' },
    { value: 'other', label: 'Khác' },
  ];

  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    search: searchParams.get('search') || '',
    sortBy: '',
    product_type: '',
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
        setCategories(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Lỗi tải danh mục:', err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          search: filters.search || undefined,
          category: filters.category || undefined,
          min_price: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
          max_price: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
          min_rating: filters.minRating ? parseFloat(filters.minRating) : undefined,
          product_type: filters.product_type || undefined,
          ordering: filters.sortBy || undefined,
        };

        const filteredParams = Object.fromEntries(
          Object.entries(params).filter(([_, value]) => value !== undefined)
        );

        const response = await productsAPI.getProducts(filteredParams);
        let productsData;
        if (Array.isArray(response)) {
          productsData = response;
        } else if (response && response.data) {
          if (Array.isArray(response.data)) {
            productsData = response.data;
          } else if (response.data && Array.isArray(response.data.results)) {
            productsData = response.data.results;
          } else {
            throw new Error('Dữ liệu sản phẩm không hợp lệ');
          }
        } else {
          throw new Error('Response không hợp lệ');
        }

        const featured = productsData
          .sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0))
          .slice(0, 6);
        const recent = JSON.parse(localStorage.getItem('recentProducts') || '[]')
          .map(id => productsData.find(p => p.id === id))
          .filter(p => p)
          .slice(0, 6);

        setProducts(productsData);
        setFeaturedProducts(featured);
        setRecentProducts(recent);
      } catch (err) {
        setError(err.message || 'Lỗi tải sản phẩm');
        setProducts([]);
        setFeaturedProducts([]);
        setRecentProducts([]);
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
    if (name === 'minRating' && value && (parseFloat(value) < 1 || parseFloat(value) > 5)) return;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      search: '',
      sortBy: '',
      product_type: '',
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

  const updateRecentProducts = (productId) => {
    let recent = JSON.parse(localStorage.getItem('recentProducts') || '[]');
    recent = [productId, ...recent.filter(id => id !== productId)].slice(0, 6);
    localStorage.setItem('recentProducts', JSON.stringify(recent));
    setRecentProducts(recent.map(id => products.find(p => p.id === id)).filter(p => p));
  };

  const renderProductCard = (product) => {
    const averageRating = product?.avg_rating || null;
    const productImage = product?.image
      ? getMediaUrl(product.image)
      : getMediaUrl('/media/products/placeholder.jpg');

    const handleAddToCart = async () => {
      try {
        await addToCart(product.id, 1);
        setSuccessMessage('Thêm vào giỏ hàng thành công!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        setError('Thêm vào giỏ hàng thất bại. Vui lòng thử lại.');
        setTimeout(() => setError(null), 3000);
      }
    };

    const handleProductClick = () => {
      updateRecentProducts(product.id);
      navigate(`/products/${product.id}`, { replace: false });
    };

    return (
      <div className="product-card" key={product.id}>
        <div className="relative w-full aspect-square">
          <img
            src={productImage}
            alt={product.name || 'Sản phẩm'}
            className="product-image"
            onClick={handleProductClick}
            loading="lazy"
            onError={(e) => (e.target.src = getMediaUrl('/media/products/placeholder.jpg'))}
          />
        </div>
        <div className="product-info">
          <h3 className="product-name" onClick={handleProductClick}>
            {product.name || 'Tên sản phẩm'}
          </h3>
          {averageRating && <div className="rating">Đánh giá: {averageRating.toFixed(1)} ★</div>}
          {product.sold_count !== undefined && (
            <div className="sold">Đã bán: {product.sold_count}</div>
          )}
          <div className="price">{(product.price || 0).toLocaleString('vi-VN')} ₫</div>
          <button
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={loading || product.quantity === 0}
          >
            {loading ? 'Đang tải...' : product.quantity === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="home-page">
      <CurrentDateTime />
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          {error}
        </div>
      )}
      {searchParams.get('orderId') && (
        <div className="fixed top-16 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          <p>Đặt hàng thành công! Mã đơn hàng: #{searchParams.get('orderId')}</p>
          <Button
            variant="success"
            size="small"
            onClick={() => navigate(`/orders/${searchParams.get('orderId')}`)}
            className="mt-2"
          >
            Xem trạng thái đơn hàng
          </Button>
        </div>
      )}
      <div className="hero-slider">
        <div className="slider-content" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {sliderImages.map((image, index) => (
            <div className="slide relative w-full aspect-[4/3]" key={index}>
              <img
                src={getMediaUrl(image)}
                alt={`Slide ${index}`}
                className="slide-image"
                loading="lazy"
                onError={(e) => (e.target.src = getMediaUrl('/media/products/placeholder.jpg'))}
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
          <select
            name="product_type"
            value={filters.product_type}
            onChange={handleFilterChange}
            className="filter-select"
          >
            {productTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
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
            min="0"
          />
          <input
            type="number"
            name="maxPrice"
            placeholder="Giá tối đa"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            className="filter-input"
            min="0"
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
            min="1"
            max="5"
            step="0.1"
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
        { title: 'Sản phẩm xem gần đây', products: recentProducts, ref: recentRef },
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
                Array(6)
                  .fill()
                  .map((_, i) => (
                    <div className="product-card snap-start placeholder" key={i}>
                      <div className="product-image h-48"></div>
                      <div className="product-info">
                        <div className="h-6 w-3/4 mb-2"></div>
                        <div className="h-4 w-1/2 mb-2"></div>
                        <div className="h-4 w-1/3 mb-4"></div>
                        <div className="h-10 w-full"></div>
                      </div>
                    </div>
                  ))
              ) : error ? (
                <div className="error-state">{error}</div>
              ) : section.products.length > 0 ? (
                section.products.map(renderProductCard)
              ) : (
                <div className="no-results">Không có sản phẩm nào phù hợp</div>
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
      <footer className="bg-gray-800 text-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg">Hiếu - hieu@example.com</p>
          <div className="mt-4 flex justify-center gap-4">
            <a href="tel:+84912345678" className="hover:text-indigo-400">+84 912 345 678</a>
            <a href="mailto:support@example.com" className="hover:text-indigo-400">support@example.com</a>
            <a href="https://facebook.com" className="hover:text-indigo-400">Facebook</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;