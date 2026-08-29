import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';


interface CheckoutPageProps {
  token: string | null;
  currentUser: any;
  clearCart?: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  clearCart,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { booking: any; tour: any } | null;

  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'momo' | 'vnpay'>('bank');
  const [step, setStep] = useState<2 | 3>(2);
  const [loading, setLoading] = useState(false);

  const handlePaymentSubmit = async () => {
    if (paymentMethod === 'vnpay') {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8080/api/bookings/vnpay-url?bookingIds=${bookingIds}`);
        const data = await res.json();
        if (res.ok && data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          alert(data.message || 'Không thể tạo liên kết thanh toán VNPay.');
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        alert('Lỗi kết nối máy chủ thanh toán.');
        setLoading(false);
      }
    } else {
      handleConfirmPaid();
    }
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!state || !state.booking || !state.tour) {
    return <Navigate to="/cart" replace />;
  }

  const { booking, tour } = state;
  const isMultiple = Array.isArray(booking);
  const bookingsList = isMultiple ? booking : (booking ? [booking] : []);
  const toursList = isMultiple ? tour : (tour ? [tour] : []);

  if (bookingsList.length === 0 || toursList.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const totalCost = toursList.reduce((sum: number, t: any, idx: number) => {
    const b = bookingsList[idx];
    if (!t || !b) return sum;
    return sum + t.price * b.numberOfGuests;
  }, 0);

  const bookingIds = bookingsList.map(b => b.id).join('-');
  const referenceText = `Bintravel DH${bookingIds}`.substring(0, 50);

  // Generate VietQR URL dynamically
  const vietQrUrl = `https://api.vietqr.io/image/970422-1900117788-W63lK1t.jpg?accountName=CONG%20TY%20BINTRAVEL&amount=${totalCost}&addInfo=${encodeURIComponent(referenceText)}`;

  const handleConfirmPaid = () => {
    setLoading(true);
    // Simulate payment validation
    setTimeout(() => {
      setLoading(false);
      setStep(3);
      if (clearCart) {
        clearCart();
      }
    }, 1500);
  };

  const handleFinish = () => {
    navigate('/profile?tab=bookings');
  };

  return (
    <div className="planner-page-container page-fade" style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb-container" aria-label="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/')}>Trang chủ</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-link" onClick={() => navigate('/cart')}>Giỏ Hàng</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-active">Thanh Toán An Toàn</span>
      </nav>

      {step === 2 ? (
        <div className="dashboard-card" style={{ padding: '2.5rem', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
          {/* Header Step bar */}
          <div className="checkout-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
            <div className="checkout-steps" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem' }}>
              <span className="step done" style={{ color: '#10b981' }}>✓ Giỏ Hàng</span>
              <span className="step-arrow" style={{ color: '#cbd5e1' }}>➔</span>
              <span className="step active" style={{ color: '#e11d74' }}>💳 Thanh toán an toàn</span>
              <span className="step-arrow" style={{ color: '#cbd5e1' }}>➔</span>
              <span className="step pending" style={{ color: '#94a3b8' }}>🎉 Hoàn tất đặt chỗ</span>
            </div>
            <h2 className="dashboard-title" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Thanh Toán Đơn Hàng Tour
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              Vui lòng chuyển khoản thanh toán hoặc quét mã QR dưới đây để hoàn tất việc đăng ký đặt tour.
            </p>
          </div>

          <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '2rem' }}>
            
            {/* Left Column: Invoice Details */}
            <div className="checkout-invoice-pane" style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h3 className="pane-heading" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', borderBottom: '2.5px solid #e11d74', display: 'inline-block', paddingBottom: '0.25rem' }}>
                📋 Chi tiết hóa đơn thanh toán
              </h3>
              
              <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {toursList.map((t: any, idx: number) => {
                  const b = bookingsList[idx];
                  if (!t || !b) return null;
                  return (
                    <div key={b.id || idx} style={{ marginBottom: '1.25rem', borderBottom: idx < toursList.length - 1 ? '1px dashed var(--border)' : 'none', paddingBottom: '1.25rem' }}>
                      <div className="invoice-tour-box" style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                        <img src={t.imageUrl} alt={t.title} className="invoice-tour-img" style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '6px' }} />
                        <div className="invoice-tour-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <h4 className="invoice-tour-title" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1.3' }}>{t.title}</h4>
                          <span className="invoice-tour-meta" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>📍 {t.location} | ⏱️ {t.duration}</span>
                        </div>
                      </div>

                      <div className="invoice-details-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
                        <div className="invoice-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Mã đơn hàng:</span>
                          <strong style={{ color: 'var(--text-main)' }}>#{b.id}</strong>
                        </div>
                        <div className="invoice-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Ngày khởi hành:</span>
                          <strong style={{ color: 'var(--text-main)' }}>{b.departureDate}</strong>
                        </div>
                        <div className="invoice-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Số lượng khách:</span>
                          <strong style={{ color: 'var(--text-main)' }}>{b.numberOfGuests} người</strong>
                        </div>
                        <div className="invoice-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Đơn giá:</span>
                          <strong style={{ color: 'var(--text-main)' }}>{t.price.toLocaleString('vi-VN')} đ / khách</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="invoice-divider" style={{ height: '1px', background: 'var(--border)', margin: '1rem 0' }}></div>
              <div className="invoice-item total" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.15rem' }}>
                <span style={{ fontWeight: 600 }}>Tổng tiền cần thanh toán:</span>
                <span className="invoice-total-amount" style={{ fontWeight: 800, color: '#10b981' }}>{totalCost.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Right Column: Payment Details */}
            <div className="checkout-payment-pane" style={{ padding: '0 0.5rem' }}>
              <h3 className="pane-heading" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', borderBottom: '2.5px solid #e11d74', display: 'inline-block', paddingBottom: '0.25rem' }}>
                💳 Chọn phương thức thanh toán
              </h3>

              <div className="payment-methods-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <button 
                  type="button"
                  className={`pay-tab-btn ${paymentMethod === 'bank' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('bank')}
                  style={{
                    flex: 1,
                    background: paymentMethod === 'bank' ? 'var(--bg-secondary)' : 'none',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.65rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: paymentMethod === 'bank' ? '#e11d74' : 'var(--text-muted)',
                    boxShadow: paymentMethod === 'bank' ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  🏦 Chuyển khoản ngân hàng
                </button>
                <button 
                  type="button"
                  className={`pay-tab-btn ${paymentMethod === 'momo' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('momo')}
                  style={{
                    flex: 1,
                    background: paymentMethod === 'momo' ? 'var(--bg-secondary)' : 'none',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.65rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: paymentMethod === 'momo' ? '#e11d74' : 'var(--text-muted)',
                    boxShadow: paymentMethod === 'momo' ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  📱 Ví MoMo
                </button>
                <button 
                  type="button"
                  className={`pay-tab-btn ${paymentMethod === 'vnpay' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('vnpay')}
                  style={{
                    flex: 1,
                    background: paymentMethod === 'vnpay' ? 'var(--bg-secondary)' : 'none',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.65rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: paymentMethod === 'vnpay' ? '#e11d74' : 'var(--text-muted)',
                    boxShadow: paymentMethod === 'vnpay' ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  💳 Cổng VNPay
                </button>
              </div>

              {paymentMethod === 'bank' && (
                <div className="payment-bank-details" style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div className="bank-info-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <div className="bank-info-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tên ngân hàng:</span>
                      <strong>MB Bank (Ngân hàng Quân Đội)</strong>
                    </div>
                    <div className="bank-info-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Số tài khoản:</span>
                      <strong style={{ color: '#e11d74', fontSize: '1rem' }}>1900 1177 88</strong>
                    </div>
                    <div className="bank-info-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Chủ tài khoản:</span>
                      <strong>CONG TY BINTRAVEL</strong>
                    </div>
                    <div className="bank-info-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Nội dung chuyển khoản:</span>
                      <strong style={{ color: 'var(--primary)' }}>Bintravel {bookingIds}</strong>
                    </div>
                  </div>

                  <div className="qr-code-wrapper" style={{ textAlign: 'center', background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 500 }}>
                      Mở ứng dụng Ngân hàng quét QR VietQR dưới đây để thanh toán nhanh
                    </p>
                    <img 
                      src={vietQrUrl} 
                      alt="VietQR Code" 
                      style={{ maxWidth: '230px', width: '100%', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }} 
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'momo' && (
                <div className="payment-momo-details" style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div className="momo-info-box" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <div className="bank-info-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Số điện thoại MoMo:</span>
                      <strong style={{ color: '#e11d74', fontSize: '1rem' }}>0909 117 788</strong>
                    </div>
                    <div className="bank-info-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tên người nhận:</span>
                      <strong>NGUYỄN VĂN A</strong>
                    </div>
                    <div className="bank-info-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Nội dung ghi chú:</span>
                      <strong style={{ color: 'var(--primary)' }}>Bintravel {bookingIds}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', background: 'var(--bg-tertiary)', padding: '2rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📱</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Quét ví MoMo chuyển tiền tới số tài khoản trên với nội dung chuyển khoản tương ứng.
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === 'vnpay' && (
                <div className="payment-vnpay-details" style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ textAlign: 'center', background: 'var(--bg-tertiary)', padding: '2.5rem 1.5rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💳</div>
                    <h4 style={{ color: 'var(--text-main)', fontWeight: 700, marginBottom: '0.5rem' }}>Thanh toán trực tuyến VNPay</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, lineHeight: '1.5', maxWidth: '380px', margin: '0 auto 1.5rem auto' }}>
                      Bạn sẽ được chuyển hướng an toàn đến Cổng thanh toán VNPay để quét mã QR hoặc nhập thông tin thẻ ngân hàng của bạn.
                    </p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border)', paddingTop: '1rem' }}>
                      Hỗ trợ thẻ ATM nội địa, QR Code ứng dụng Ngân hàng và thẻ quốc tế Visa/Mastercard.
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '2rem', gap: '1rem' }}>
            <button 
              type="button"
              className="btn-reset" 
              onClick={() => navigate('/cart')}
              style={{ padding: '0.8rem 1.5rem', cursor: 'pointer' }}
            >
              Quay lại giỏ hàng
            </button>
            <button 
              type="button"
              className="btn-dashboard-save btn-security"
              onClick={handlePaymentSubmit}
              disabled={loading}
              style={{
                width: 'auto',
                padding: '0.8rem 2.5rem',
                fontSize: '1rem',
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              {loading ? 'Đang xử lý...' : paymentMethod === 'vnpay' ? 'Thanh toán trực tuyến qua VNPay ➔' : 'Xác nhận đã chuyển khoản thành công ➔'}
            </button>
          </div>
        </div>
      ) : (
        /* Step 3: Success View page */
        <div className="dashboard-card" style={{ padding: '3.5rem 2.5rem', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', textAlign: 'center', maxWidth: '650px', margin: '0 auto' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '3rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', border: '2.5px solid #10b981' }}>
            ✓
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Đặt Tour Thành Công!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi. Yêu cầu đặt tour mã đơn hàng <strong style={{ color: '#e11d74' }}>#{bookingIds}</strong> đã được ghi nhận. Tư vấn viên sẽ liên hệ xác thực qua số điện thoại của bạn trong 15 phút tới.
          </p>

          <div style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'left', marginBottom: '2rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Khách hàng đại diện:</span>
              <strong style={{ color: 'var(--text-main)' }}>{bookingsList[0]?.fullName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Số điện thoại liên hệ:</span>
              <strong style={{ color: 'var(--text-main)' }}>{bookingsList[0]?.phone}</strong>
            </div>
            <div style={{ height: '1px', background: 'var(--border)', margin: '0.75rem 0' }}></div>
            {toursList.map((t: any, idx: number) => {
              const b = bookingsList[idx];
              if (!t || !b) return null;
              return (
                <div key={b.id || idx} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span>• {t.title} ({b.numberOfGuests} khách)</span>
                  <span style={{ fontWeight: 600 }}>{(t.price * b.numberOfGuests).toLocaleString('vi-VN')} đ</span>
                </div>
              );
            })}
            <div style={{ height: '1px', background: 'var(--border)', margin: '0.75rem 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1rem' }}>
              <span>Tổng cộng thanh toán:</span>
              <strong style={{ color: '#10b981' }}>{totalCost.toLocaleString('vi-VN')} đ</strong>
            </div>
          </div>

          <button 
            type="button"
            className="btn-dashboard-save btn-security"
            onClick={handleFinish}
            style={{
              width: '100%',
              padding: '0.9rem',
              fontSize: '1rem',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              margin: 0
            }}
          >
            Quản lý danh sách đặt tour ➔
          </button>
        </div>
      )}
    </div>
  );
};
