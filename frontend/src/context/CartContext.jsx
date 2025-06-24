import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../api/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setCartItems(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cart');
      console.error('Fetch cart error:', err);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCartItems([]);
      setLoading(false);
      setError(null);
    }
  }, [user, fetchCart]);

  const addToCart = async (productId, quantity) => {
    try {
      setLoading(true);
      setError(null);
      await cartAPI.addToCart(productId, quantity);
      await fetchCart();
    } catch (err) {
      console.error('Error adding to cart:', err.response?.data || err.message);
      setError('Thêm vào giỏ hàng thất bại. Vui lòng thử lại.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      setLoading(true);
      setError(null);
      await cartAPI.updateCartItem(itemId, quantity);
      await fetchCart();
    } catch (err) {
      console.error('Error updating cart item:', err.response?.data || err.message);
      setError('Cập nhật số lượng thất bại. Vui lòng thử lại.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      setLoading(true);
      setError(null);
      await cartAPI.removeFromCart(itemId);
      await fetchCart();
    } catch (err) {
      console.error('Error removing from cart:', err.response?.data || err.message);
      setError('Xóa sản phẩm thất bại. Vui lòng thử lại.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);
      await cartAPI.clearCart();
      setCartItems([]);
    } catch (err) {
      console.error('Error clearing cart:', err.response?.data || err.message);
      setError('Xóa giỏ hàng thất bại. Vui lòng thử lại.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        error,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);