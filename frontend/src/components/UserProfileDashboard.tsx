import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TripPlanner } from './TripPlanner';
import { TourCard } from './TourCard';
import type { Tour } from './TourCard';

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  favoriteCategory?: string;
  favoriteLocation?: string;
}

interface UserProfileDashboardProps {
  user: User;
  token: string;
  locations: string[];
  onUpdateUser: (updatedUser: User) => void;
  onClose: () => void;
  onToggleFavorite?: (tourId: number) => void;
}

export const UserProfileDashboard: React.FC<UserProfileDashboardProps> = ({
  user,
  token,
  locations,
  onUpdateUser,
  onClose,
  onToggleFavorite,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'profile' | 'planner' | 'bookings' | 'favorites'>(() => {
    if (tabParam === 'bookings' || tabParam === 'planner' || tabParam === 'favorites') {
      return tabParam as any;
    }
    return 'profile';
  });

  useEffect(() => {
    if (tabParam === 'bookings' || tabParam === 'planner' || tabParam === 'profile' || tabParam === 'favorites') {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const handleTabChange = (newTab: 'profile' | 'planner' | 'bookings' | 'favorites') => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [favoriteTours, setFavoriteTours] = useState<Tour[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchUserBookings();
    } else if (activeTab === 'favorites') {
      fetchFavoriteTours();
    }
  }, [activeTab]);

  const fetchFavoriteTours = async () => {
    setFavoritesLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFavoriteTours(data);
      }
    } catch (e) {
      console.error('Error fetching favorite tours:', e);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const handleDashboardToggleFavorite = async (tourId: number) => {
    if (onToggleFavorite) {
      await onToggleFavorite(tourId);
    }
    setFavoriteTours(prev => prev.filter(t => t.id !== tourId));
  };

  const fetchUserBookings = async () => {
    setBookingsLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/bookings/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUserBookings(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBookingsLoading(false);
    }
  };

  // Profile state
  const [fullName, setFullName] = useState(user.fullName || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [favoriteCategory, setFavoriteCategory] = useState(user.favoriteCategory || '');
  const [favoriteLocation, setFavoriteLocation] = useState(user.favoriteLocation || '');

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Status states
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          favoriteCategory,
          favoriteLocation,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Cập nhật thông tin thất bại.');
      }

      onUpdateUser(data);
      setProfileSuccess('Cập nhật thông tin cá nhân thành công!');
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Mật khẩu mới nhập lại không khớp!');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/users/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Thay đổi mật khẩu thất bại.');
      }

      setPasswordSuccess('Đổi mật khẩu thành công!');
      // Clear fields
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatDepartureDate = (dateStr: string) => {
    if (!dateStr) return 'Liên hệ để được tư vấn và mua tour';
    const cleanStr = dateStr.trim();
    if (cleanStr === '' || cleanStr.toLowerCase() === 'n/a') {
      return 'Liên hệ để được tư vấn và mua tour';
    }
    // Check if the value contains commas or tags indicating categories rather than dates
    const hasComma = cleanStr.includes(',');
    const hasTags = cleanStr.includes('nuoc ngoai') || cleanStr.includes('trong nuoc') || 
                    cleanStr.includes('le hoi') || cleanStr.includes('dao') || 
                    cleanStr.includes('bien') || cleanStr.includes('nghi duong') ||
                    cleanStr.includes('mien trung');
    const hasNumbers = /\d/.test(cleanStr);

    if (hasNumbers && !hasTags && !hasComma) {
      return cleanStr;
    }
    return 'Liên hệ để được tư vấn và mua tour';
  };

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb-container" aria-label="breadcrumb">
        <span className="breadcrumb-link" onClick={onClose}>Trang chủ</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-active">Hồ sơ & Quản lý tài khoản</span>
      </nav>

      <div className="dashboard-header" style={{ marginTop: '0.5rem' }}>
        <div>
          <h2 className="dashboard-title" style={{ color: '#e11d74' }}>Hồ Sơ & Quản Lý Tài Khoản</h2>
          <p className="dashboard-subtitle">
            Quản lý thông tin cá nhân, cài đặt gợi ý và bảo mật tài khoản của bạn.
          </p>
        </div>
        <div className="user-avatar-large">
          <span className="avatar-initial">
            {fullName ? fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      {/* User Dashboard Tabs */}
      <div className="admin-tabs">
        <button 
          className={`admin-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => handleTabChange('profile')}
        >
          ⚙️ Cài đặt tài khoản
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'planner' ? 'active' : ''}`}
          onClick={() => handleTabChange('planner')}
        >
          📅 Lịch trình của tôi
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => handleTabChange('bookings')}
        >
          🛒 Lịch sử đặt Tour
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => handleTabChange('favorites')}
        >
          ❤️ Tour yêu thích
        </button>
      </div>

      {activeTab === 'planner' ? (
        <TripPlanner token={token} />
      ) : activeTab === 'bookings' ? (
        <div className="planner-detail-area">
          <h3 className="card-heading" style={{ marginBottom: '1.5rem' }}>🛒 Đơn đặt Tour của tôi</h3>
          {bookingsLoading ? (
            <div style={{ color: 'var(--text-muted)' }}>Đang tải lịch sử đặt tour...</div>
          ) : userBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '3rem' }}>🛍️</span>
              <p style={{ marginTop: '1rem' }}>Bạn chưa đặt bất kỳ tour du lịch nào.</p>
            </div>
          ) : (
            <div className="expenses-list-wrapper" style={{ maxHeight: 'none' }}>
              <table className="expense-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Tên Tour du lịch</th>
                    <th>Ngày khởi hành</th>
                    <th>Số lượng</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {userBookings.map(item => {
                    const booking = item.booking;
                    const tour = item.tour;
                    const totalPrice = tour ? tour.price * booking.numberOfGuests : 0;
                    return (
                      <tr key={booking.id}>
                        <td>#{booking.id}</td>
                        <td style={{ fontWeight: 600 }}>{tour ? tour.title : 'Tour không xác định'}</td>
                        <td>{formatDepartureDate(booking.departureDate)}</td>
                        <td>{booking.numberOfGuests} người</td>
                        <td style={{ color: 'var(--accent)', fontWeight: 700 }}>
                          {totalPrice > 0 ? totalPrice.toLocaleString('vi-VN') + ' đ' : 'Liên hệ'}
                        </td>
                        <td>
                          <span className={`status-badge ${booking.status.toLowerCase()}`}>
                            {booking.status === 'PENDING' ? '⏳ Chờ duyệt' : booking.status === 'CONFIRMED' ? '✅ Đã xác nhận' : '❌ Đã hủy'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'favorites' ? (
        <div className="planner-detail-area">
          <h3 className="card-heading" style={{ marginBottom: '1.5rem' }}>❤️ Danh sách Tour yêu thích của tôi</h3>
          {favoritesLoading ? (
            <div style={{ color: 'var(--text-muted)' }}>Đang tải danh sách yêu thích...</div>
          ) : favoriteTours.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '3rem' }}>❤️</span>
              <p style={{ marginTop: '1rem' }}>Bạn chưa lưu tour yêu thích nào.</p>
            </div>
          ) : (
            <div className="tours-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
              {favoriteTours.map(tour => (
                <TourCard 
                  key={tour.id} 
                  tour={tour} 
                  isFavorite={true}
                  onToggleFavorite={handleDashboardToggleFavorite} 
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="dashboard-grid-layout">
        {/* Left Card: Profile & Preferences */}
        <div className="dashboard-card">
          <h3 className="card-heading">ℹ️ Thông tin cá nhân & Gợi ý</h3>
          
          {profileError && <div className="auth-alert error">{profileError}</div>}
          {profileSuccess && <div className="auth-alert success">{profileSuccess}</div>}

          <form onSubmit={handleUpdateProfile} className="dashboard-form">
            <div className="form-row">
              <div className="form-group half">
                <label htmlFor="db-username">Tên tài khoản (Không thể sửa)</label>
                <input 
                  id="db-username"
                  type="text" 
                  value={user.username} 
                  disabled 
                  className="input-disabled"
                />
              </div>
              <div className="form-group half">
                <label htmlFor="db-fullname">Họ và tên</label>
                <input 
                  id="db-fullname"
                  type="text" 
                  placeholder="Nhập họ tên đầy đủ"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label htmlFor="db-email">Email</label>
                <input 
                  id="db-email"
                  type="email" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group half">
                <label htmlFor="db-phone">Số điện thoại</label>
                <input 
                  id="db-phone"
                  type="tel" 
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="preferences-section">
              <h4 className="pref-heading">✨ Cá nhân hóa gợi ý Tour AI</h4>
              <p className="pref-subtext">
                Hệ thống sẽ tự động ưu tiên gợi ý các Tour phù hợp với lựa chọn của bạn.
              </p>
              
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="db-pref-cat">Loại hình Tour yêu thích</label>
                  <select 
                    id="db-pref-cat"
                    value={favoriteCategory}
                    onChange={(e) => setFavoriteCategory(e.target.value)}
                  >
                    <option value="">-- Chọn loại hình --</option>
                    <option value="Trong nước">Trong nước</option>
                    <option value="Nước ngoài">Nước ngoài</option>
                  </select>
                </div>
                
                <div className="form-group half">
                  <label htmlFor="db-pref-loc">Địa danh bạn muốn đi nhất</label>
                  <select 
                    id="db-pref-loc"
                    value={favoriteLocation}
                    onChange={(e) => setFavoriteLocation(e.target.value)}
                  >
                    <option value="">-- Chọn địa điểm --</option>
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-dashboard-save" disabled={profileLoading}>
              {profileLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </form>
        </div>

        {/* Right Card: Security & Change Password */}
        <div className="dashboard-card">
          <h3 className="card-heading">🔒 Bảo mật & Đổi mật khẩu</h3>
          <p className="pref-subtext" style={{ marginBottom: '1.25rem' }}>
            Đổi mật khẩu định kỳ giúp tài khoản của bạn luôn an toàn.
          </p>

          {passwordError && <div className="auth-alert error">{passwordError}</div>}
          {passwordSuccess && <div className="auth-alert success">{passwordSuccess}</div>}

          <form onSubmit={handleChangePassword} className="dashboard-form">
            <div className="form-group">
              <label htmlFor="db-old-pass">Mật khẩu hiện tại *</label>
              <input 
                id="db-old-pass"
                type="password" 
                placeholder="Nhập mật khẩu hiện tại"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="db-new-pass">Mật khẩu mới *</label>
              <input 
                id="db-new-pass"
                type="password" 
                placeholder="Nhập mật khẩu mới (từ 6 ký tự)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="db-confirm-new-pass">Nhập lại mật khẩu mới *</label>
              <input 
                id="db-confirm-new-pass"
                type="password" 
                placeholder="Nhập lại mật khẩu mới để xác nhận"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-dashboard-save btn-security" disabled={passwordLoading}>
              {passwordLoading ? 'Đang đổi mật khẩu...' : 'Cập Nhật Mật Khẩu'}
            </button>
          </form>
        </div>
        </div>
      )}
    </div>
  );
};
