import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, reviewsAPI, getMediaUrl } from '../../api/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import StarRating from '../../components/common/StarRating';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const productTypes = [
    { value: '', label: 'Tất cả loại sản phẩm' },
    { value: 'electronics', label: 'Điện tử' },
    { value: 'clothing', label: 'Quần áo' },
    { value: 'food', label: 'Thực phẩm' },
    { value: 'furniture', label: 'Nội thất' },
    { value: 'other', label: 'Khác' },
  ];

  const [state, setState] = useState({
    product: null,
    reviews: [],
    averageRating: 0,
    loading: true,
    error: null,
    reviewText: '',
    rating: 5,
    guestName: '',
    reviewError: '',
    reviewLoading: false,
    successMessage: '',
  });

  const fetchProductData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Lấy dữ liệu sản phẩm từ API
      const productRes = await productsAPI.getProduct(id);
      console.log('Product API Response:', productRes);

      // Kiểm tra xem dữ liệu trả về có tồn tại không
      if (!productRes || typeof productRes !== 'object') {
        throw new Error('Dữ liệu sản phẩm không hợp lệ');
      }

      // Tạo đối tượng productData với các giá trị mặc định
      const productData = {
        ...productRes,
        price: Number(productRes.price) || 0,
        image: getMediaUrl(productRes.image) || getMediaUrl('/media/products/placeholder.jpg'),
        seller: productRes.seller || { username: 'Không xác định', id: null, seller_rating: null },
      };

      // Lấy danh sách đánh giá (reviews)
      let reviews = [];
      let averageRating = 0;
      try {
        const reviewsRes = await reviewsAPI.getProductReviews(id);
        reviews = reviewsRes.data || [];
        averageRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;
        console.log('Reviews API Response:', reviews);
      } catch (reviewErr) {
        console.error('Reviews Fetch Error:', reviewErr.response?.data || reviewErr.message);
      }

      // Cập nhật trạng thái với dữ liệu đã xử lý
      setState((prev) => ({
        ...prev,
        product: productData,
        reviews,
        averageRating,
        loading: false,
      }));
    } catch (err) {
      console.error('Product Fetch Error:', err.message || err);
      setState((prev) => ({
        ...prev,
        error: err.message === 'Sản phẩm không tồn tại' || err.response?.status === 404
          ? 'Sản phẩm không tồn tại'
          : 'Lỗi tải dữ liệu sản phẩm. Vui lòng thử lại.',
        loading: false,
      }));
    }
  }, [id]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  const handleAddToCart = async () => {
    if (state.product && state.product.quantity > 0) {
      try {
        await addToCart(state.product.id, 1);
        setState((prev) => ({
          ...prev,
          successMessage: 'Thêm vào giỏ hàng thành công!',
        }));
        setTimeout(() => {
          setState((prev) => ({ ...prev, successMessage: '' }));
          navigate('/cart');
        }, 2000);
      } catch (error) {
        console.error('Lỗi thêm vào giỏ:', error);
        setState((prev) => ({
          ...prev,
          error: 'Thêm vào giỏ hàng thất bại. Vui lòng thử lại.',
        }));
        setTimeout(() => setState((prev) => ({ ...prev, error: '' })), 3000);
      }
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!state.reviewText.trim()) {
      setState((prev) => ({ ...prev, reviewError: 'Vui lòng nhập nội dung đánh giá' }));
      return;
    }
    if (!user && !state.guestName.trim()) {
      setState((prev) => ({ ...prev, reviewError: 'Vui lòng nhập tên của bạn' }));
      return;
    }
    try {
      setState((prev) => ({ ...prev, reviewLoading: true, reviewError: '' }));
      const reviewData = {
        rating: state.rating,
        comment: state.reviewText,
      };
      if (!user) {
        reviewData.guest_name = state.guestName;
      }
      const res = await reviewsAPI.createReview(state.product.id, reviewData);
      const updatedReviews = [res.data, ...state.reviews];
      const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
      const newAverage = totalRating / updatedReviews.length;
      setState((prev) => ({
        ...prev,
        reviews: updatedReviews,
        averageRating: newAverage,
        reviewText: '',
        guestName: '',
        rating: 5,
        reviewLoading: false,
        successMessage: 'Đánh giá đã được gửi thành công!',
      }));
      setTimeout(() => setState((prev) => ({ ...prev, successMessage: '' })), 3000);
    } catch (err) {
      console.error('Review Submit Error:', err.response?.data || err.message);
      setState((prev) => ({
        ...prev,
        reviewError: err.response?.data?.message || 'Lỗi khi gửi đánh giá',
        reviewLoading: false,
      }));
    }
  };

  const handleRatingChange = useCallback(
    (newRating) => setState((prev) => ({ ...prev, rating: newRating })),
    []
  );

  const handleReviewTextChange = (e) => {
    setState((prev) => ({
      ...prev,
      reviewText: e.target.value,
      reviewError: '',
    }));
  };

  const handleGuestNameChange = (e) => {
    setState((prev) => ({
      ...prev,
      guestName: e.target.value,
      reviewError: '',
    }));
  };

  const handleSellerClick = () => {
    if (state.product?.seller?.id) {
      navigate(`/sellers/${state.product.seller.id}`);
    }
  };

  const { product, reviews, averageRating, loading, error, reviewText, guestName, rating, reviewError, reviewLoading, successMessage } = state;

  if (loading) return <div className="loading">Đang tải sản phẩm...</div>;
  if (error) return <div className="error">Lỗi: {error}</div>;
  if (!product) return <div className="not-found">Không tìm thấy sản phẩm</div>;

  return (
    <div className="product-detail">
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
      <div className="product-main">
        <div className="product-image">
          <img
            src={product.image}
            alt={product.name}
            onError={(e) => (e.target.src = getMediaUrl('/media/products/placeholder.jpg'))}
          />
        </div>
        <div className="product-info">
          <h1>{product.name}</h1>
          <div className="product-rating-summary">
            <StarRating rating={averageRating} />
            <span className="rating-value">{averageRating.toFixed(1)}/5</span>
            <span className="review-count">({reviews.length} đánh giá)</span>
          </div>
          <p className="price">{product.price ? `${product.price.toLocaleString('vi-VN')} ₫` : 'Liên hệ'}</p>
          <p className="category">Danh mục: {product.category?.name || 'Không phân loại'}</p>
          <p className="category">Loại sản phẩm: {productTypes.find((type) => type.value === product.product_type)?.label || 'Khác'}</p>
          <p className="category">Số lượng tồn: {product.quantity}</p>
          <div className="seller-info">
            <span className="seller-label">Người bán: </span>
            <span
              className="seller-name"
              onClick={handleSellerClick}
              style={{ cursor: product.seller?.id ? 'pointer' : 'default' }}
            >
              {product.seller?.username || 'Không xác định'}
              {product.seller?.seller_rating && ` (${product.seller.seller_rating.toFixed(1)} ★)`}
            </span>
          </div>
          <div className="description">
            <h3>Mô tả sản phẩm</h3>
            <p>{product.description || 'Chưa có mô tả sản phẩm.'}</p>
          </div>
          <div className="product-actions">
            <Button onClick={handleAddToCart} disabled={!product.quantity}>
              {product.quantity ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
            </Button>
          </div>
        </div>
      </div>
      <div className="product-reviews">
        <h2>Đánh giá sản phẩm</h2>
        <div className="review-stats">
          <div className="overall-rating">
            <StarRating rating={averageRating} size="large" />
            <div className="rating-text">{averageRating.toFixed(1)} trên 5</div>
            <div className="total-reviews">{reviews.length} đánh giá</div>
          </div>
          <div className="rating-distribution">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviews.filter((r) => r.rating === stars).length;
              const percent = reviews.length ? (count / reviews.length) * 100 : 0;
              return (
                <div key={stars} className="rating-bar">
                  <span className="stars">{stars} sao</span>
                  <div className="bar-container">
                    <div className="bar-fill" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        {reviews.length === 0 ? (
          <p className="no-reviews">Chưa có đánh giá nào cho sản phẩm này.</p>
        ) : (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review">
                <div className="review-header">
                  <div className="user-info">
                    <div className="avatar">
                      {(review.user?.username || review.guest_name || 'Khách').charAt(0).toUpperCase()}
                    </div>
                    <span className="username">{review.user?.username || review.guest_name || 'Khách'}</span>
                  </div>
                  <div className="review-meta">
                    <StarRating rating={review.rating} />
                    <span className="date">{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmitReview} className="review-form">
          <h3>Viết đánh giá của bạn</h3>
          {reviewError && <div className="error-message">{reviewError}</div>}
          {!user && (
            <div className="form-group">
              <label>Tên của bạn</label>
              <input
                type="text"
                value={guestName}
                onChange={handleGuestNameChange}
                placeholder="Nhập tên của bạn..."
              />
            </div>
          )}
          <div className="form-group">
            <label>Đánh giá sao</label>
            <StarRating rating={rating} editable onRatingChange={handleRatingChange} />
          </div>
          <div className="form-group">
            <label>Nội dung đánh giá</label>
            <textarea
              value={reviewText}
              onChange={handleReviewTextChange}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
              rows="5"
            />
          </div>
          <Button type="submit" disabled={reviewLoading} className="submit-review-btn">
            {reviewLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProductDetail;