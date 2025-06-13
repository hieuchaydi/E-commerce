  import React, { useState, useEffect, useCallback } from 'react';
  import { useParams, useNavigate } from 'react-router-dom';
  import { productsAPI, reviewsAPI } from '../../api/api';
  import { useCart } from '../../context/CartContext'; // Added useCart
  import { useAuth } from '../../context/AuthContext';
  import Button from '../../components/common/Button';
  import StarRating from '../../components/common/StarRating';
  import './ProductDetail.css';

  const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart(); // Added useCart hook
    const { user } = useAuth();

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
    });

    const fetchProductData = useCallback(async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));
        
        const [productRes, reviewsRes] = await Promise.all([
          productsAPI.getProduct(id),
          reviewsAPI.getProductReviews(id)
        ]);

        const productData = {
          ...productRes.data,
          price: Number(productRes.data.price) || 0
        };

        const reviews = reviewsRes.data;
        const averageRating = reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

        setState(prev => ({
          ...prev,
          product: productData,
          reviews,
          averageRating,
          loading: false
        }));
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: err.response?.data?.message || 'Lỗi tải dữ liệu sản phẩm',
          loading: false
        }));
      }
    }, [id]);

    useEffect(() => {
      fetchProductData();
    }, [fetchProductData]);

    const handleAddToCart = async () => {
      if (state.product && state.product.in_stock) {
        try {
          console.log('Adding product to cart:', state.product.id); // Debug log
          await addToCart(state.product.id, 1);
          console.log('Product added successfully'); // Confirm action
        } catch (error) {
          console.error('Failed to add to cart:', error);
        }
      }
    };

    const handleSubmitReview = async (e) => {
      e.preventDefault();

      if (!state.reviewText.trim()) {
        setState(prev => ({ ...prev, reviewError: 'Vui lòng nhập nội dung đánh giá' }));
        return;
      }

      if (!user && !state.guestName.trim()) {
        setState(prev => ({ ...prev, reviewError: 'Vui lòng nhập tên của bạn' }));
        return;
      }

      try {
        setState(prev => ({ ...prev, reviewLoading: true, reviewError: '' }));

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

        setState(prev => ({
          ...prev,
          reviews: updatedReviews,
          averageRating: newAverage,
          reviewText: '',
          guestName: '',
          rating: 5,
          reviewLoading: false
        }));
      } catch (err) {
        setState(prev => ({
          ...prev,
          reviewError: err.response?.data?.message || 'Lỗi khi gửi đánh giá',
          reviewLoading: false
        }));
      }
    };

    const handleRatingChange = useCallback((newRating) => {
      setState(prev => ({ ...prev, rating: newRating }));
    }, []);

    const handleReviewTextChange = (e) => {
      setState(prev => ({ 
        ...prev, 
        reviewText: e.target.value,
        reviewError: '' 
      }));
    };

    const handleGuestNameChange = (e) => {
      setState(prev => ({ 
        ...prev, 
        guestName: e.target.value,
        reviewError: '' 
      }));
    };

    const { 
      product, 
      reviews, 
      averageRating, 
      loading, 
      error, 
      reviewText, 
      guestName,
      rating, 
      reviewError, 
      reviewLoading 
    } = state;

    if (loading) return <div className="loading">Đang tải sản phẩm...</div>;
    if (error) return <div className="error">Lỗi: {error}</div>;
    if (!product) return <div className="not-found">Không tìm thấy sản phẩm</div>;

    return (
      <div className="product-detail">
        <div className="product-main">
          <div className="product-image">
            <img
              src={product.image || '/placeholder-product.png'}
              alt={product.name}
              onError={(e) => (e.target.src = '/placeholder-product.png')}
            />
          </div>

          <div className="product-info">
            <h1>{product.name}</h1>

            <div className="product-rating-summary">
              <StarRating rating={averageRating} />
              <span className="rating-value">{averageRating.toFixed(1)}/5</span>
              <span className="review-count">({reviews.length} đánh giá)</span>
            </div>

            <p className="price">
              {product.price ? `${product.price.toLocaleString('vi-VN')}₫` : 'Liên hệ'}
            </p>

            <p className="category">
              Danh mục: {product.category?.name || 'Không phân loại'}
            </p>

            <div className="description">
              <h3>Mô tả sản phẩm</h3>
              <p>{product.description || 'Chưa có mô tả sản phẩm.'}</p>
            </div>

            <div className="product-actions">
              <Button 
                onClick={handleAddToCart} 
                disabled={!product.in_stock}
              >
                {product.in_stock ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
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
                const count = reviews.filter(r => r.rating === stars).length;
                const percent = reviews.length ? (count / reviews.length) * 100 : 0;
                
                return (
                  <div key={stars} className="rating-bar">
                    <span className="stars">{stars} sao</span>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${percent}%` }} 
                      />
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
                        {(review.user?.username || (review.comment.includes('[Guest:') ? review.comment.split(']')[0].replace('[Guest: ', '') : 'Khách')).charAt(0).toUpperCase()}
                      </div>
                      <span className="username">
                        {review.user?.username || (review.comment.includes('[Guest:') ? review.comment.split(']')[0].replace('[Guest: ', '') : 'Khách')}
                      </span>
                    </div>
                    <div className="review-meta">
                      <StarRating rating={review.rating} />
                      <span className="date">
                        {new Date(review.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <p className="review-comment">
                    {review.comment.includes('[Guest:') 
                      ? review.comment.split('] ')[1] 
                      : review.comment}
                  </p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmitReview} className="review-form">
            <h3>Viết đánh giá của bạn</h3>
            
            {reviewError && (
              <div className="error-message">{reviewError}</div>
            )}
            
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
              <StarRating 
                rating={rating} 
                editable 
                onRatingChange={handleRatingChange} 
              />
            </div>
            
            <div className="form-group">
              <label>Nội dung đánh giá</label>
              <textarea
                value={reviewText}
                onChange={handleReviewTextChange}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này ..."
                rows="5"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={reviewLoading}
              className="submit-review-btn"
            >
              {reviewLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          </form>
        </div>
      </div>
    );
  };

  export default ProductDetail;