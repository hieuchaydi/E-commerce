import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/api';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authAPI.updateUser(user.id, formData);
      setUser(response.data);
      setIsEditing(false);
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Cập nhật hồ sơ thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      toast.success('Đổi mật khẩu thành công!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Đổi mật khẩu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="profile-container">
      <h1>Hồ sơ cá nhân</h1>
      <div className="profile-content">
        <div className="profile-info">
          <h2>Thông tin cá nhân</h2>
          {isEditing ? (
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>Tên người dùng</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-actions">
                <button type="submit" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <div>
              <p><strong>Tên người dùng:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Số điện thoại:</strong> {user.phone || 'Chưa cung cấp'}</p>
              <p><strong>Địa chỉ:</strong> {user.address || 'Chưa cung cấp'}</p>
              <p><strong>Vai trò:</strong> {user.role}</p>
              <button onClick={() => setIsEditing(true)}>Chỉnh sửa</button>
            </div>
          )}
        </div>
        <div className="password-change">
          <h2>Đổi mật khẩu</h2>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Mật khẩu hiện tại</label>
              <input
                type="password"
                name="current_password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input
                type="password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Xác nhận mật khẩu mới</label>
              <input
                type="password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;