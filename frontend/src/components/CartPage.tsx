import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CartItem } from '../App';

interface CartPageProps {
  cart: CartItem[];
  updateCartQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  token: string | null;
  currentUser: any;
}

export const CartPage: React.FC<CartPageProps> = ({
  cart,
  updateCartQty,
  removeFromCart,
  token,
  currentUser,
}) => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  

  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill user profile info if logged in
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || currentUser.username || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.tour.price * item.numberOfGuests, 0);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (cart.length === 0) {
      setErrorMsg('Giỏ hàng của bạn đang trống.');
      return;
    }

    if (!fullName || !email || !phone) {
      setErrorMsg('Vui lòng nhập đầy đủ thông tin liên hệ của người đặt.');
      return;
    }

    try {
      setBookingLoading(true);

      // Create bookings in parallel for all cart items
      const promises = cart.map(item => {
        const payload = {
          tourId: item.tour.id,
          fullName,
          email,
          phone,
          departureDate: item.departureDate,
          numberOfGuests: item.numberOfGuests,
          notes: item.notes ? `${item.notes} | Note chung: ${generalNotes}` : generalNotes,
        };

        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        return fetch('http://localhost:8080/api/bookings', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        }).then(async res => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Lỗi đặt tour.');
          }
          return res.json();
        });
      });

      const results = await Promise.all(promises);
      navigate('/checkout', { state: { booking: results, tour: cart.map(i => i.tour) } });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Có lỗi xảy ra trong quá trình đặt tour. Vui lòng kiểm tra lại kết nối mạng.');
    } finally {
      setBookingLoading(false);
    }
  };


  return (
    <div className="cart-page-container page-fade">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb-container" aria-label="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/')}>Trang chủ</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-active">Giỏ Hàng Tour</span>
      </nav>


      <div style={{ marginBottom: '2rem' }}>
        <h2 className="dashboard-title" style={{ fontSize: '1.75rem', color: 'var(--text-main)' }}>
          Giỏ hàng Tour <span style={{ color: '#e00070' }}>của bạn</span>
        </h2>
      </div>

      {errorMsg && <div className="auth-alert error" style={{ maxWidth: '800px', margin: '0 auto 1.5rem auto' }}>{errorMsg}</div>}

      {cart.length === 0 ? (
        <div className="empty-state" style={{ padding: '5rem 2rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '2px dashed var(--border)', textAlign: 'center' }}>
          {/* Outlined cart SVG */}
          <svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#e00070" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 1.5rem auto' }}>
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.5rem 0' }}>Giỏ hàng của bạn đang trống</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '2rem' }}>Khám phá các tour và dịch vụ du lịch hấp dẫn để bắt đầu đặt chỗ.</p>
          <button 
            className="btn-header-admin" 
            onClick={() => navigate('/')}
            style={{ padding: '0.75rem 2.5rem', background: '#e00070', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer', fontWeight: 600 }}
          >
            Khám phá tour du lịch
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Left Column: Cart Items List */}
          <div className="cart-items-section">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Danh sách tour chọn ({cart.length})</h3>
            
            {cart.map(item => {
              const itemTotal = item.tour.price * item.numberOfGuests;
              return (
                <div key={item.id} className="cart-item-card">
                  <img 
                    src={item.tour.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=60'} 
                    alt={item.tour.title} 
                    className="cart-item-img"
                  />
                  
                  <div className="cart-item-details">
                    <h4 
                      onClick={() => navigate(`/tour/${item.tour.id}`)}
                      className="cart-item-title"
                      style={{ cursor: 'pointer' }}
                    >
                      {item.tour.title}
                    </h4>
                    <div className="cart-item-meta">
                      <span>📍 Điểm đến: <strong>{item.tour.location}</strong></span>
                      <span>⏱️ Thời gian: <strong>{item.tour.duration}</strong></span>
                      <span>📅 Ngày đi: <strong style={{ color: 'var(--primary)' }}>{item.departureDate}</strong></span>
                    </div>
                    {item.notes && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', background: 'rgba(255,255,255,0.02)', padding: '0.35rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        📝 Yêu cầu: {item.notes}
                      </div>
                    )}
                    <div className="cart-item-price-info">
                      Đơn giá: <strong>{item.tour.price.toLocaleString('vi-VN')} đ</strong> / người
                    </div>
                  </div>

                  <div className="cart-item-actions">
                    {/* Quantity Stepper */}
                    <div className="quantity-stepper">
                      <button 
                        type="button" 
                        className="qty-btn"
                        onClick={() => updateCartQty(item.id, item.numberOfGuests - 1)}
                        disabled={item.numberOfGuests <= 1}
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        className="qty-input"
                        value={item.numberOfGuests}
                        onChange={e => updateCartQty(item.id, Number(e.target.value))}
                        min={1}
                        max={50}
                      />
                      <button 
                        type="button" 
                        className="qty-btn"
                        onClick={() => updateCartQty(item.id, item.numberOfGuests + 1)}
                        disabled={item.numberOfGuests >= 50}
                      >
                        +
                      </button>
                    </div>

                    <div className="cart-item-total-price">
                      {itemTotal.toLocaleString('vi-VN')} đ
                    </div>

                    <button 
                      type="button" 
                      className="btn-remove-cart"
                      onClick={() => removeFromCart(item.id)}
                      title="Xóa tour khỏi giỏ"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Checkout Form & Summary */}
          <div className="cart-summary-section">
            <div className="cart-summary-card">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                💳 Thanh toán giỏ hàng
              </h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tổng số lượng tour:</span>
                <strong style={{ color: 'var(--text-main)' }}>{cart.length} tour</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontSize: '1.15rem' }}>
                <span>Tổng chi phí:</span>
                <strong style={{ color: '#10b981' }}>{getSubtotal().toLocaleString('vi-VN')} đ</strong>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckoutSubmit} className="dashboard-form" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Họ và tên khách hàng *</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Họ tên người đại diện liên hệ"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Địa chỉ Email *</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Ghi chú đơn hàng chung (tùy chọn)</label>
                  <textarea 
                    rows={2}
                    value={generalNotes}
                    onChange={e => setGeneralNotes(e.target.value)}
                    placeholder="Lưu ý chung cho cả chuyến đi..."
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)',
                      fontFamily: 'var(--font-primary)',
                      padding: '0.6rem',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-dashboard-save btn-security"
                  style={{ width: '100%', marginTop: '1.5rem', padding: '0.8rem', backgroundColor: '#e00070', borderColor: '#e00070' }}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? 'Đang xử lý...' : 'Xác Nhận Đặt Tour & Thanh Toán ➔'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
