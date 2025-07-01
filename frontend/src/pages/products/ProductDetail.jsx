import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, reviewsAPI, getMediaUrl } from '../../api/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import StarRating from '../../components/common/StarRating';
import EmojiPicker from 'emoji-picker-react';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams(); // Lấy ID sản phẩm từ URL
  const navigate = useNavigate(); // Điều hướng trang
  const { addToCart } = useCart(); // Hook thêm sản phẩm vào giỏ hàng
  const { user } = useAuth(); // Hook lấy thông tin người dùng

  // Danh sách loại sản phẩm
  const productTypes = [
    { value: '', label: 'Tất cả loại sản phẩm' },
    { value: 'electronics', label: 'Điện tử' },
    { value: 'clothing', label: 'Quần áo' },
    { value: 'food', label: 'Thực phẩm' },
    { value: 'furniture', label: 'Nội thất' },
    { value: 'other', label: 'Khác' },
  ];

  // Trạng thái ban đầu
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
    selectedImages: [],
    selectedVideos: [],
    showEmojiPicker: false,
  });

  // Hàm tải dữ liệu sản phẩm và đánh giá
  const fetchProductData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const productRes = await productsAPI.getProduct(id);
      console.log('Phản hồi API sản phẩm:', productRes);

      if (!productRes || typeof productRes !== 'object') {
        throw new Error('Dữ liệu sản phẩm không hợp lệ');
      }

      const productData = {
        ...productRes,
        price: Number(productRes.price) || 0,
        image: getMediaUrl(productRes.image) || getMediaUrl('/products/placeholder.jpg'),
        seller: productRes.seller || { username: 'Không xác định', id: null, seller_rating: null },
      };

      let reviews = [];
      let averageRating = 0;
      try {
        const reviewsRes = await reviewsAPI.getProductReviews(id);
        reviews = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
        averageRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length
          : 0;
        console.log('Phản hồi API đánh giá:', reviews);
      } catch (reviewErr) {
        console.error('Lỗi tải đánh giá:', reviewErr.response?.data || reviewErr.message);
      }

      setState((prev) => ({
        ...prev,
        product: productData,
        reviews,
        averageRating,
        loading: false,
      }));
    } catch (err) {
      console.error('Lỗi tải sản phẩm:', err.message || err);
      setState((prev) => ({
        ...prev,
        error: err.message === 'Sản phẩm không tồn tại' || err.response?.status === 404
          ? 'Sản phẩm không tồn tại'
          : 'Lỗi tải dữ liệu sản phẩm. Vui lòng thử lại.',
        loading: false,
      }));
    }
  }, [id]);

  // Gọi hàm tải dữ liệu khi component được mount
  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  // Hàm thêm sản phẩm vào giỏ hàng
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

  // Xử lý chọn hình ảnh
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validImages = files.filter(file => file.type.startsWith('image/'));
    if (validImages.length + state.selectedImages.length > 4) {
      setState(prev => ({
        ...prev,
        reviewError: 'Chỉ được tải lên tối đa 4 hình ảnh'
      }));
      return;
    }
    setState(prev => ({
      ...prev,
      selectedImages: [...prev.selectedImages, ...validImages],
      reviewError: ''
    }));
  };

  // Xử lý chọn video
  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    const validVideos = files.filter(file => file.type.startsWith('video/') && file.size <= 50 * 1024 * 1024);
    if (validVideos.length + state.selectedVideos.length > 2) {
      setState(prev => ({
        ...prev,
        reviewError: 'Chỉ được tải lên tối đa 2 video'
      }));
      return;
    }
    setState(prev => ({
      ...prev,
      selectedVideos: [...prev.selectedVideos, ...validVideos],
      reviewError: ''
    }));
  };

  // Xử lý chọn biểu tượng cảm xúc
  const handleEmojiClick = (emojiObject) => {
    setState(prev => ({
      ...prev,
      reviewText: prev.reviewText + emojiObject.emoji,
      showEmojiPicker: false
    }));
  };

  // Bật/tắt trình chọn biểu tượng cảm xúc
  const toggleEmojiPicker = () => {
    setState(prev => ({
      ...prev,
      showEmojiPicker: !prev.showEmojiPicker
    }));
  };

  // Xóa hình ảnh hoặc video
  const removeMedia = (type, index) => {
    setState(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  // Xử lý gửi đánh giá
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
      const formData = new FormData();
      formData.append('rating', state.rating);
      formData.append('comment', state.reviewText);
      if (!user) {
        formData.append('guest_name', state.guestName);
      }
      state.selectedImages.forEach(image => {
        formData.append('image_files', image);
      });
      state.selectedVideos.forEach(video => {
        formData.append('video_files', video);
      });

      const res = await reviewsAPI.createReview(state.product.id, formData);
      console.log('Phản hồi gửi đánh giá:', res.data);
      console.log('Hình ảnh trong phản hồi:', res.data.images || 'Không có hình ảnh');
      console.log('Video trong phản hồi:', res.data.videos || 'Không có video');

      const updatedReviews = [res.data, ...state.reviews];
      const totalRating = updatedReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
      const newAverage = updatedReviews.length ? totalRating / updatedReviews.length : 0;

      setState((prev) => ({
        ...prev,
        reviews: updatedReviews,
        averageRating: newAverage,
        reviewText: '',
        guestName: '',
        rating: 5,
        selectedImages: [],
        selectedVideos: [],
        showEmojiPicker: false,
        reviewLoading: false,
        successMessage: 'Đánh giá đã được gửi thành công!',
      }));
      setTimeout(() => setState((prev) => ({ ...prev, successMessage: '' })), 3000);
    } catch (err) {
      console.error('Lỗi gửi đánh giá:', err.response?.data || err.message);
      setState((prev) => ({
        ...prev,
        reviewError: err.response?.status === 404
          ? 'Sản phẩm không tồn tại. Vui lòng kiểm tra lại.'
          : err.response?.data?.detail || 'Lỗi khi gửi đánh giá. Vui lòng thử lại.',
        reviewLoading: false,
      }));
    }
  };

  // Xử lý thay đổi đánh giá sao
  const handleRatingChange = useCallback(
    (newRating) => setState((prev) => ({ ...prev, rating: newRating })),
    []
  );

  // Xử lý thay đổi nội dung đánh giá
  const handleReviewTextChange = (e) => {
    setState((prev) => ({
      ...prev,
      reviewText: e.target.value,
      reviewError: '',
    }));
  };

  // Xử lý thay đổi tên khách hàng
  const handleGuestNameChange = (e) => {
    setState((prev) => ({
      ...prev,
      guestName: e.target.value,
      reviewError: '',
    }));
  };

  // Xử lý nhấp vào thông tin người bán
  const handleSellerClick = () => {
    if (state.product?.seller?.id) {
      navigate(`/sellers/${state.product.seller.id}`);
    }
  };

  const { product, reviews, averageRating, loading, error, reviewText, guestName, rating, reviewError, reviewLoading, successMessage, selectedImages, selectedVideos, showEmojiPicker } = state;

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
            onError={(e) => {
              console.error(`Không tải được hình ảnh sản phẩm ${id}`);
              e.target.src = getMediaUrl('/products/placeholder.jpg');
            }}
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
              style={{ cursor: product.seller?.id ? 'pointer' : 'default', color: product.seller?.id ? '#007bff' : 'inherit' }}
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
                    <StarRating rating={Number(review.rating) || 0} />
                    <span className="date">{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                <p className="review-comment">{review.comment || 'Không có bình luận'}</p>
                {(review.images?.length > 0 || review.videos?.length > 0) ? (
                  <div className="review-media">
                    {review.images?.length > 0 && (
                      <div className="review-images">
                        {review.images.map((img, index) => (
                          <img
                            key={`image-${review.id}-${index}`}
                            src={getMediaUrl(img.image || '/products/placeholder.jpg')}
                            alt={`Đánh giá ${index + 1} cho ${product.name}`}
                            className="review-image"
                            style={{ maxWidth: '150px', maxHeight: '150px', margin: '5px', borderRadius: '5px', objectFit: 'cover' }}
                            onError={(e) => {
                              console.error(`Không tải được hình ảnh đánh giá ${index + 1} cho đánh giá ${review.id}`);
                              e.target.src = getMediaUrl('/products/placeholder.jpg');
                            }}
                          />
                        ))}
                      </div>
                    )}
                    {review.videos?.length > 0 && (
                      <div className="review-videos">
                        {review.videos.map((vid, index) => (
                          <video
                            key={`video-${review.id}-${index}`}
                            src={getMediaUrl(vid.video)}
                            controls
                            className="review-video"
                            style={{ maxWidth: '300px', maxHeight: '200px', margin: '5px', borderRadius: '5px' }}
                            onError={(e) => {
                              console.error(`Không tải được video ${index + 1} cho đánh giá ${review.id}`);
                              e.target.parentElement.innerHTML = '<p className="error-text">Không thể tải video</p>';
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="no-media">Không có hình ảnh hoặc video.</p>
                )}
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
            <div className="review-text-container">
              <textarea
                value={reviewText}
                onChange={handleReviewTextChange}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                rows="5"
              />
              <Button
                type="button"
                onClick={toggleEmojiPicker}
                className="emoji-button"
              >
                😊
              </Button>
            </div>
            {showEmojiPicker && (
              <div className="emoji-picker">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Thêm hình ảnh (tối đa 4)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
            <div className="media-preview">
              {selectedImages.map((img, index) => (
                <div key={index} className="media-item">
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`Xem trước ${index + 1}`}
                    style={{ maxWidth: '100px', maxHeight: '100px', margin: '5px' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeMedia('selectedImages', index)}
                    className="remove-media"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Thêm video (tối đa 2)</label>
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoChange}
            />
            <div className="media-preview">
              {selectedVideos.map((vid, index) => (
                <div key={index} className="media-item">
                  <video
                    src={URL.createObjectURL(vid)}
                    controls
                    style={{ maxWidth: '200px', maxHeight: '150px', margin: '5px' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeMedia('selectedVideos', index)}
                    className="remove-media"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
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