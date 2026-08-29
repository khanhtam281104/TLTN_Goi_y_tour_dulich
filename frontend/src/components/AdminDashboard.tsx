import React, { useEffect, useState } from 'react';

interface Tour {
  id?: number;
  title: string;
  price: number;
  duration: string;
  location: string;
  category: string;
  imageUrl: string;
  tourUrl: string;
  tags?: string;
  description?: string;
  departureDates?: string;
}

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

interface SystemLog {
  id: number;
  action: string;
  details: string;
  username: string;
  timestamp: string;
}

interface AdminDashboardProps {
  token: string;
  currentUser: any;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  currentUser,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'tours' | 'users' | 'bookings' | 'feedbacks'>('logs');

  // Data states
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/feedbacks');
      const data = await res.json();
      if (res.ok) {
        setFeedbacks(data);
      } else {
        showAlert(data.message || 'Lỗi khi tải ý kiến đóng góp', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Lỗi kết nối máy chủ', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Search & Filters
  const [tourSearch, setTourSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Loading & Alert states
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states for adding/editing Tour
  const [showTourModal, setShowTourModal] = useState(false);
  const [editingTourId, setEditingTourId] = useState<number | null>(null);
  const [tourForm, setTourForm] = useState<Tour>({
    title: '',
    price: 0,
    duration: '',
    location: '',
    category: 'Trong nước',
    imageUrl: '',
    tourUrl: '',
    tags: '',
    description: '',
    departureDates: '',
  });

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // Fetch functions
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/admin/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setLogs(data);
      } else {
        showAlert(data.message || 'Lỗi khi tải nhật ký', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Lỗi kết nối máy chủ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTours = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/tours');
      const data = await res.json();
      if (res.ok) {
        setTours(data);
      } else {
        showAlert('Lỗi khi tải danh sách tour', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Lỗi kết nối máy chủ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      } else {
        showAlert(data.message || 'Lỗi khi tải danh sách người dùng', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Lỗi kết nối máy chủ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/admin/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBookings(data);
      } else {
        showAlert('Lỗi khi tải danh sách đặt tour', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Lỗi kết nối máy chủ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (id: number, status: string) => {
    if (!window.confirm(`Xác nhận chuyển trạng thái đơn hàng #${id} thành ${status === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN' : 'ĐÃ HỦY'}?`)) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:8080/api/admin/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('Cập nhật trạng thái đơn đặt tour thành công!');
        fetchBookings();
      } else {
        showAlert(data.message || 'Lỗi khi cập nhật trạng thái', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Lỗi kết nối máy chủ', 'error');
    }
  };

  // Fetch initial data based on active tab
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'tours') {
      fetchTours();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'bookings') {
      fetchBookings();
    } else if (activeTab === 'feedbacks') {
      fetchFeedbacks();
    }
  }, [activeTab]);

  // CRUD Tour Actions
  const handleOpenAddTour = () => {
    setEditingTourId(null);
    setTourForm({
      title: '',
      price: 0,
      duration: '',
      location: '',
      category: 'Trong nước',
      imageUrl: '',
      tourUrl: '',
      tags: '',
      description: '',
      departureDates: '',
    });
    setShowTourModal(true);
  };

  const handleOpenEditTour = (tour: Tour) => {
    setEditingTourId(tour.id || null);
    setTourForm({
      title: tour.title,
      price: tour.price,
      duration: tour.duration,
      location: tour.location,
      category: tour.category,
      imageUrl: tour.imageUrl || '',
      tourUrl: tour.tourUrl || '',
      tags: tour.tags || '',
      description: tour.description || '',
      departureDates: tour.departureDates || '',
    });
    setShowTourModal(true);
  };

  const handleSaveTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourForm.title.trim()) {
      showAlert('Tên tour không được để trống', 'error');
      return;
    }

    try {
      const method = editingTourId ? 'PUT' : 'POST';
      const url = editingTourId 
        ? `http://localhost:8080/api/admin/tours/${editingTourId}` 
        : 'http://localhost:8080/api/admin/tours';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tourForm),
      });

      const data = await res.json();
      if (res.ok) {
        showAlert(editingTourId ? 'Cập nhật tour thành công!' : 'Thêm tour mới thành công!');
        setShowTourModal(false);
        fetchTours();
      } else {
        showAlert(data.message || 'Lỗi khi lưu thông tin tour', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Lỗi kết nối máy chủ', 'error');
    }
  };

  const handleDeleteTour = async (id: number, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tour "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/admin/tours/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('Xóa tour thành công!');
        fetchTours();
      } else {
        showAlert(data.message || 'Lỗi khi xóa tour', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Lỗi kết nối máy chủ', 'error');
    }
  };

  // User Actions
  const handleToggleUserRole = async (userId: number, currentRole: string, username: string) => {
    if (userId === currentUser.id) {
      showAlert('Bạn không thể tự đổi quyền của chính mình!', 'error');
      return;
    }

    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(`Xác nhận đổi quyền của người dùng "${username}" thành ${newRole}?`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('Cập nhật vai trò người dùng thành công!');
        fetchUsers();
      } else {
        showAlert(data.message || 'Lỗi cập nhật vai trò', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Lỗi kết nối máy chủ', 'error');
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (userId === currentUser.id) {
      showAlert('Bạn không thể tự xóa chính mình!', 'error');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN người dùng "${username}"?`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('Xóa người dùng thành công!');
        fetchUsers();
      } else {
        showAlert(data.message || 'Lỗi khi xóa người dùng', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Lỗi kết nối máy chủ', 'error');
    }
  };

  // Filter lists
  const filteredTours = tours.filter(tour =>
    tour.title.toLowerCase().includes(tourSearch.toLowerCase()) ||
    tour.location.toLowerCase().includes(tourSearch.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const formatPrice = (price: number) => {
    if (price === 0) return 'Liên hệ';
    return price.toLocaleString('vi-VN') + ' đ';
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="dashboard-container admin-dashboard">
      {/* Admin Dashboard Header */}
      <div className="dashboard-header">
        <div>
          <button className="btn-back" onClick={onClose}>
            ← Quay lại trang chủ
          </button>
          <h2 className="dashboard-title">Trang Quản Trị Hệ Thống (Admin Control Panel)</h2>
          <p className="dashboard-subtitle">
            Hệ thống quản lý Tour du lịch, người dùng và giám sát nhật ký toàn hệ thống.
          </p>
        </div>
        <div className="admin-status-badge">
          <span>🛠️ ADMIN: <strong>{currentUser.fullName || currentUser.username}</strong></span>
        </div>
      </div>

      {/* Alert banner */}
      {alert && (
        <div className={`auth-alert ${alert.type === 'success' ? 'success' : 'error'}`} style={{ margin: '1rem 0' }}>
          {alert.message}
        </div>
      )}

      {/* Admin Tabs */}
      <div className="admin-tabs">
        <button 
          className={`admin-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📊 Nhật Ký Hoạt Động
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'tours' ? 'active' : ''}`}
          onClick={() => setActiveTab('tours')}
        >
          🗺️ Quản Lý Tour
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Quản Lý Người Dùng
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          🛒 Quản Lý Đặt Tour
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'feedbacks' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedbacks')}
        >
          💌 Ý Kiến Góp Ý
        </button>
      </div>

      {/* Loading state indicator */}
      {loading && <div className="admin-loading">Đang tải dữ liệu từ server...</div>}

      {/* TAB 4: BOOKINGS MANAGEMENT (Admin) */}
      {activeTab === 'bookings' && !loading && (
        <div className="dashboard-card admin-card">
          <div className="card-header-flex">
            <h3 className="card-heading">🛒 Danh sách đơn đặt Tour toàn hệ thống</h3>
            <button className="btn-refresh" onClick={fetchBookings}>🔄 Tải lại</button>
          </div>
          <p className="pref-subtext" style={{ marginBottom: '1rem' }}>
            Duyệt đơn hàng đặt tour của khách hàng và người dùng đăng ký trực tuyến.
          </p>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Liên hệ (SĐT / Email)</th>
                  <th>Tên Tour đặt</th>
                  <th>Ngày khởi hành</th>
                  <th>Số khách</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Thao tác duyệt</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Không có đơn đặt tour nào.</td>
                  </tr>
                ) : (
                  bookings.map(item => {
                    const booking = item.booking;
                    const tour = item.tour;
                    return (
                      <tr key={booking.id}>
                        <td>#{booking.id}</td>
                        <td><strong>{booking.fullName}</strong></td>
                        <td>
                          <div>📞: {booking.phone}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>✉️: {booking.email}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{tour ? tour.title : 'Tour không xác định'}</td>
                        <td>{booking.departureDate}</td>
                        <td>{booking.numberOfGuests} người</td>
                        <td>
                          <span className={`status-badge ${booking.status.toLowerCase()}`}>
                            {booking.status === 'PENDING' ? '⏳ Chờ duyệt' : booking.status === 'CONFIRMED' ? '✅ Đã xác nhận' : '❌ Đã hủy'}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions" style={{ justifyContent: 'center', gap: '0.5rem' }}>
                            {booking.status === 'PENDING' && (
                              <>
                                <button 
                                  className="btn-action-role promote"
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'CONFIRMED')}
                                >
                                  ✅ Xác nhận
                                </button>
                                <button 
                                  className="btn-action-delete" 
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'CANCELLED')}
                                >
                                  ❌ Hủy đơn
                                </button>
                              </>
                            )}
                            {booking.status !== 'PENDING' && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Đã xử lý</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 1: SYSTEM LOGS */}
      {activeTab === 'logs' && !loading && (
        <div className="dashboard-card admin-card">
          <div className="card-header-flex">
            <h3 className="card-heading">📜 Lịch sử nhật ký hoạt động hệ thống</h3>
            <button className="btn-refresh" onClick={fetchLogs}>🔄 Tải lại</button>
          </div>
          <p className="pref-subtext" style={{ marginBottom: '1rem' }}>
            Giám sát thời gian thực mọi hành động xảy ra trong hệ thống từ đăng nhập, sửa đổi dữ liệu đến các thao tác của Admin.
          </p>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th style={{ width: '180px' }}>Hành Động</th>
                  <th style={{ width: '150px' }}>Người Thực Hiện</th>
                  <th>Chi Tiết</th>
                  <th style={{ width: '180px' }}>Thời Gian</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Không có log hệ thống nào.</td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id}>
                      <td>#{log.id}</td>
                      <td>
                        <span className={`log-badge ${log.action.toLowerCase()}`}>
                          {log.action}
                        </span>
                      </td>
                      <td><strong>{log.username}</strong></td>
                      <td className="log-details">{log.details}</td>
                      <td>{formatDate(log.timestamp)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TOURS MANAGEMENT */}
      {activeTab === 'tours' && !loading && (
        <div className="dashboard-card admin-card">
          <div className="card-header-flex">
            <h3 className="card-heading">🗺️ Quản lý danh mục tour và dữ liệu AI</h3>
            <div className="action-row">
              <input 
                type="text" 
                className="admin-search-input" 
                placeholder="Tìm kiếm tour theo tên, địa điểm..."
                value={tourSearch}
                onChange={e => setTourSearch(e.target.value)}
              />
              <button className="btn-add-tour" onClick={handleOpenAddTour}>
                ➕ Thêm Tour Mới
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Thông tin Tour</th>
                  <th style={{ width: '120px' }}>Phân loại</th>
                  <th style={{ width: '120px' }}>Địa điểm</th>
                  <th style={{ width: '120px' }}>Giá</th>
                  <th style={{ width: '90px' }}>Thời gian</th>
                  <th style={{ width: '300px' }}>Tags dữ liệu cho AI</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTours.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy tour nào phù hợp.</td>
                  </tr>
                ) : (
                  filteredTours.map(tour => (
                    <tr key={tour.id}>
                      <td>#{tour.id}</td>
                      <td>
                        <div className="tour-table-info">
                          <img 
                            src={tour.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100'} 
                            alt={tour.title} 
                            className="tour-table-img" 
                          />
                          <div>
                            <div className="tour-table-title" title={tour.title}>{tour.title}</div>
                            {tour.tourUrl && <a href={tour.tourUrl} target="_blank" rel="noreferrer" className="tour-link-text">🔗 Link gốc</a>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`card-badge ${tour.category === 'Trong nước' ? 'domestic' : 'intl'}`} style={{ position: 'static' }}>
                          {tour.category}
                        </span>
                      </td>
                      <td><strong>{tour.location}</strong></td>
                      <td className="price-color">{formatPrice(tour.price)}</td>
                      <td>{tour.duration}</td>
                      <td>
                        <div className="tags-container">
                          {tour.tags ? (
                            tour.tags.split(',').map((tag, idx) => (
                              <span key={idx} className="tag-pill">{tag.trim()}</span>
                            ))
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Chưa cập nhật tags</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-action-edit" onClick={() => handleOpenEditTour(tour)}>
                            ✏️ Sửa
                          </button>
                          <button className="btn-action-delete" onClick={() => handleDeleteTour(tour.id!, tour.title)}>
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USERS MANAGEMENT */}
      {activeTab === 'users' && !loading && (
        <div className="dashboard-card admin-card">
          <div className="card-header-flex">
            <h3 className="card-heading">👥 Quản lý tài khoản người dùng</h3>
            <input 
              type="text" 
              className="admin-search-input" 
              placeholder="Tìm user theo username, email, tên..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Username</th>
                  <th>Họ và Tên</th>
                  <th>Email</th>
                  <th>Số Điện Thoại</th>
                  <th style={{ width: '120px' }}>Quyền Hạn</th>
                  <th style={{ width: '150px' }}>Sở Thích</th>
                  <th style={{ width: '180px', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy người dùng nào.</td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className={user.id === currentUser.id ? 'current-user-row' : ''}>
                      <td>#{user.id}</td>
                      <td><strong>{user.username}</strong> {user.id === currentUser.id && <span className="you-pill">Bạn</span>}</td>
                      <td>{user.fullName || <span style={{ color: 'var(--text-muted)' }}>Chưa điền</span>}</td>
                      <td>{user.email || <span style={{ color: 'var(--text-muted)' }}>Chưa điền</span>}</td>
                      <td>{user.phone || <span style={{ color: 'var(--text-muted)' }}>Chưa điền</span>}</td>
                      <td>
                        <span className={`role-badge ${user.role.toLowerCase()}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <div>📁: {user.favoriteCategory || 'Chưa chọn'}</div>
                          <div>📍: {user.favoriteLocation || 'Chưa chọn'}</div>
                        </div>
                      </td>
                      <td>
                        <div className="table-actions" style={{ justifyContent: 'center' }}>
                          <button 
                            className={`btn-action-role ${user.role === 'ADMIN' ? 'demote' : 'promote'}`}
                            onClick={() => handleToggleUserRole(user.id, user.role, user.username)}
                            disabled={user.id === currentUser.id}
                            title="Thay đổi quyền hạn tài khoản"
                          >
                            🔄 {user.role === 'ADMIN' ? 'Hạ cấp USER' : 'Nâng cấp ADMIN'}
                          </button>
                          <button 
                            className="btn-action-delete" 
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            disabled={user.id === currentUser.id}
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: FEEDBACKS LIST */}
      {activeTab === 'feedbacks' && !loading && (
        <div className="dashboard-card admin-card" style={{ maxWidth: '100%' }}>
          <div className="card-header-flex">
            <h3 className="card-heading">💌 Ý kiến đóng góp & Phản hồi khách hàng</h3>
            <button className="btn-refresh" onClick={fetchFeedbacks}>🔄 Tải lại</button>
          </div>
          <p className="pref-subtext" style={{ marginBottom: '1.5rem' }}>
            Xem các phiếu góp ý, báo lỗi và ý kiến đóng góp từ khách hàng gửi về hệ thống.
          </p>

          {feedbacks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '3rem' }}>💌</span>
              <p style={{ marginTop: '1rem' }}>Hiện chưa có ý kiến đóng góp nào từ khách hàng.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>ID</th>
                    <th>Họ và Tên</th>
                    <th>Thông tin liên hệ</th>
                    <th>Chủ đề đóng góp</th>
                    <th>Chi tiết nội dung góp ý</th>
                    <th>Thời gian gửi</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map(fb => (
                    <tr key={fb.id}>
                      <td>#{fb.id}</td>
                      <td style={{ fontWeight: 600 }}>{fb.fullName}</td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>📞 {fb.phone || <span style={{ color: 'var(--text-muted)' }}>N/A</span>}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>✉️ {fb.email || <span style={{ color: 'var(--text-muted)' }}>N/A</span>}</div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{fb.title}</td>
                      <td style={{ maxWidth: '350px', whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: '1.4' }}>{fb.content}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(fb.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TOUR FORM MODAL (ADD / EDIT TOUR) */}
      {showTourModal && (
        <div className="auth-overlay" onClick={() => setShowTourModal(false)}>
          <div className="auth-card admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <button className="auth-close" onClick={() => setShowTourModal(false)}>&times;</button>
            
            <h3 className="card-heading" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              {editingTourId ? '✏️ Cập nhật thông tin Tour' : '➕ Thêm Tour du lịch mới'}
            </h3>

            <form onSubmit={handleSaveTour} className="dashboard-form">
              <div className="form-group">
                <label>Tên Tour du lịch *</label>
                <input 
                  type="text" 
                  value={tourForm.title}
                  onChange={e => setTourForm({ ...tourForm, title: e.target.value })}
                  placeholder="Nhập tên đầy đủ của tour"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Giá Tour (VND) *</label>
                  <input 
                    type="number" 
                    value={tourForm.price}
                    onChange={e => setTourForm({ ...tourForm, price: Number(e.target.value) })}
                    placeholder="Ví dụ: 3500000"
                    required
                  />
                </div>
                <div className="form-group half">
                  <label>Thời lượng di chuyển *</label>
                  <input 
                    type="text" 
                    value={tourForm.duration}
                    onChange={e => setTourForm({ ...tourForm, duration: e.target.value })}
                    placeholder="Ví dụ: 3N2Đ hoặc 4N3Đ"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Phân loại tour *</label>
                  <select 
                    value={tourForm.category}
                    onChange={e => setTourForm({ ...tourForm, category: e.target.value })}
                  >
                    <option value="Trong nước">📍 Trong nước</option>
                    <option value="Nước ngoài">✈️ Nước ngoài</option>
                  </select>
                </div>
                <div className="form-group half">
                  <label>Điểm đến / Địa danh chính *</label>
                  <input 
                    type="text" 
                    value={tourForm.location}
                    onChange={e => setTourForm({ ...tourForm, location: e.target.value })}
                    placeholder="Ví dụ: Phú Quốc, Hạ Long..."
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Đường dẫn ảnh đại diện (Image URL)</label>
                <input 
                  type="text" 
                  value={tourForm.imageUrl}
                  onChange={e => setTourForm({ ...tourForm, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-group">
                <label>Đường dẫn chi tiết tour (Tour Website URL)</label>
                <input 
                  type="text" 
                  value={tourForm.tourUrl}
                  onChange={e => setTourForm({ ...tourForm, tourUrl: e.target.value })}
                  placeholder="https://bintravel.com.vn/tour-xyz"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tags dữ liệu cho AI</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phân tách các tag bằng dấu phẩy (,)</span>
                </label>
                <input 
                  type="text" 
                  value={tourForm.tags}
                  onChange={e => setTourForm({ ...tourForm, tags: e.target.value })}
                  placeholder="Ví dụ: biển, nghỉ dưỡng, giá rẻ, miền nam"
                />
              </div>

              <div className="form-group">
                <label>Mô tả chi tiết tour (Thông tin cho AI học)</label>
                <textarea 
                  value={tourForm.description}
                  onChange={e => setTourForm({ ...tourForm, description: e.target.value })}
                  placeholder="Ví dụ: Khám phá đảo ngọc Phú Quốc, tắm biển bãi Sao, lặn ngắm san hô..."
                  rows={3}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-main)',
                    fontFamily: 'var(--font-primary)',
                    padding: '0.75rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div className="form-group">
                <label>Lịch khởi hành thực tế (Departure Dates)</label>
                <input 
                  type="text" 
                  value={tourForm.departureDates}
                  onChange={e => setTourForm({ ...tourForm, departureDates: e.target.value })}
                  placeholder="Ví dụ: 03,10,17,24/07; 01,08,15/08/2026"
                />
              </div>

              <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-reset" onClick={() => setShowTourModal(false)} style={{ margin: 0 }}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-dashboard-save" style={{ width: 'auto', padding: '0.75rem 1.5rem', margin: 0 }}>
                  {editingTourId ? 'Lưu thay đổi' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
