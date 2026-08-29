import React, { useState } from 'react';

interface CheckoutModalProps {
  isOpen: boolean;
  booking: any;
  tour: any;
  onClose: () => void;
  onConfirmSuccess?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  booking,
  tour,
  onClose,
  onConfirmSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'momo'>('bank');
  const [step, setStep] = useState<2 | 3>(2);
  const [loading, setLoading] = useState(false);

  const isMultiple = Array.isArray(booking);
  const bookingsList = isMultiple ? booking : (booking ? [booking] : []);
  const toursList = isMultiple ? tour : (tour ? [tour] : []);

  if (!isOpen || bookingsList.length === 0 || toursList.length === 0) return null;

  const totalCost = toursList.reduce((sum: number, t: any, idx: number) => {
    const b = bookingsList[idx];
    if (!t || !b) return sum;
    return sum + t.price * b.numberOfGuests;
  }, 0);

  const bookingIds = bookingsList.map(b => b.id).join('-');
  const referenceText = `Dulichviet DH${bookingIds}`.substring(0, 50);

  // Generate VietQR URL dynamically
  const vietQrUrl = `https://api.vietqr.io/image/970422-1900117788-W63lK1t.jpg?accountName=CONG%20TY%20DU%20LICH%20VIET&amount=${totalCost}&addInfo=${encodeURIComponent(referenceText)}`;

  const handleConfirmPaid = () => {
    setLoading(true);
    // Simulate payment validation
    setTimeout(() => {
      setLoading(false);
      setStep(3);
      if (onConfirmSuccess) {
        onConfirmSuccess();
      }
    }, 1500);
  };

  return (
    <div className="checkout-overlay">
      <div className="checkout-card animate-scale-up">
        {step === 2 ? (
          <>
            {/* Step Header */}
            <div className="checkout-header">
              <div className="checkout-steps">
                <span className="step done">✓ Đăng ký</span>
                <span className="step-arrow">➔</span>
                <span className="step active">💳 Thanh toán</span>
                <span className="step-arrow">➔</span>
                <span className="step pending">🎉 Hoàn tất</span>
              </div>
              <h2 className="checkout-title">Thanh Toán Đặt Tour</h2>
              <p className="checkout-subtitle">Vui lòng chọn phương thức và thực hiện thanh toán để hoàn tất giữ chỗ.</p>
            </div>

            {/* Main Content Split Grid */}
            <div className="checkout-grid">
              
              {/* Left Column: Invoice Details */}
              <div className="checkout-invoice-pane" style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                <h3 className="pane-heading">📋 Chi tiết hóa đơn</h3>
                
                {toursList.map((t: any, idx: number) => {
                  const b = bookingsList[idx];
                  if (!t || !b) return null;
                  return (
                    <div key={b.id || idx} style={{ marginBottom: '1rem', borderBottom: idx < toursList.length - 1 ? '1px dashed var(--border)' : 'none', paddingBottom: '1rem' }}>
                      <div className="invoice-tour-box">
                        <img src={t.imageUrl} alt={t.title} className="invoice-tour-img" />
                        <div className="invoice-tour-info">
                          <h4 className="invoice-tour-title">{t.title}</h4>
                          <span className="invoice-tour-meta">📍 {t.location} | ⏱️ {t.duration}</span>
                        </div>
                      </div>

                      <div className="invoice-details-list" style={{ marginTop: '0.5rem' }}>
                        <div className="invoice-item">
                          <span>Mã đơn hàng:</span>
                          <strong>#{b.id}</strong>
                        </div>
                        <div className="invoice-item">
                          <span>Ngày khởi hành:</span>
                          <strong>{b.departureDate}</strong>
                        </div>
                        <div className="invoice-item">
                          <span>Số lượng khách:</span>
                          <strong>{b.numberOfGuests} người</strong>
                        </div>
                        <div className="invoice-item">
                          <span>Đơn giá:</span>
                          <strong>{t.price.toLocaleString('vi-VN')} đ / khách</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="invoice-divider"></div>
                <div className="invoice-item total">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="invoice-total-amount">{totalCost.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              {/* Right Column: Payment Details */}
              <div className="checkout-payment-pane">
                <h3 className="pane-heading">💳 Chọn phương thức thanh toán</h3>

                <div className="payment-methods-tabs">
                  <button 
                    className={`pay-tab-btn ${paymentMethod === 'bank' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('bank')}
                  >
                    🏦 Chuyển khoản
                  </button>
                  <button 
                    className={`pay-tab-btn ${paymentMethod === 'momo' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('momo')}
                  >
                    📱 Ví MoMo
                  </button>
                </div>

                {paymentMethod === 'bank' ? (
                  <div className="payment-bank-details">
                    <div className="bank-info-grid">
                      <div className="bank-info-row">
                        <span>Ngân hàng:</span>
                        <strong>MB Bank (Ngân hàng Quân Đội)</strong>
                      </div>
                      <div className="bank-info-row">
                        <span>Số tài khoản:</span>
                        <strong className="copyable-text">1900 1177 88</strong>
                      </div>
                      <div className="bank-info-row">
                        <span>Chủ tài khoản:</span>
                        <strong>CONG TY DU LICH VIET</strong>
                      </div>
                      <div className="bank-info-row">
                        <span>Số tiền:</span>
                        <strong style={{ color: 'var(--accent)' }}>{totalCost.toLocaleString('vi-VN')} đ</strong>
                      </div>
                      <div className="bank-info-row">
                        <span>Nội dung CK:</span>
                        <strong style={{ color: 'var(--primary)' }}>Dulichviet {bookingIds}</strong>
                      </div>
                    </div>

                    <div className="qr-code-wrapper">
                      <p className="qr-instruction">Quét mã QR dưới đây để thanh toán nhanh qua VietQR</p>
                      <img src={vietQrUrl} alt="VietQR Payment Code" className="qr-code-image" />
                    </div>
                  </div>
                ) : (
                  <div className="payment-momo-details">
                    <div className="momo-info-box">
                      <div className="momo-badge">MoMo</div>
                      <div className="bank-info-grid" style={{ marginTop: '1rem' }}>
                        <div className="bank-info-row">
                          <span>Số điện thoại:</span>
                          <strong className="copyable-text">0909 117 788</strong>
                        </div>
                        <div className="bank-info-row">
                          <span>Chủ tài khoản:</span>
                          <strong>NGUYỄN VĂN A</strong>
                        </div>
                        <div className="bank-info-row">
                          <span>Số tiền:</span>
                          <strong>{totalCost.toLocaleString('vi-VN')} đ</strong>
                        </div>
                        <div className="bank-info-row">
                          <span>Nội dung chuyển:</span>
                          <strong>Dulichviet {bookingIds}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="momo-qr-mock">
                      <p className="qr-instruction">Quét mã MoMo để chuyển khoản</p>
                      <div className="momo-mock-qr-card">
                        <span style={{ fontSize: '3rem' }}>📱</span>
                        <span>Quét Ví MoMo nhận tiền</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="checkout-footer">
              <button className="btn-checkout-cancel" onClick={onClose}>
                Hủy & Thanh toán sau
              </button>
              <button 
                className="btn-checkout-confirm" 
                onClick={handleConfirmPaid}
                disabled={loading}
              >
                {loading ? 'Đang xử lý giao dịch...' : 'Xác nhận đã chuyển khoản ➔'}
              </button>
            </div>
          </>
        ) : (
          /* Step 3: Success Confirmation */
          <div className="checkout-success-view">
            <div className="success-icon-large animate-bounce-in">✓</div>
            <h2 className="success-title">Đặt Tour & Thanh Toán Thành Công!</h2>
            <p className="success-subtitle">
              Mã đơn hàng của bạn là <strong>#{bookingIds}</strong>. Chúng tôi đã ghi nhận thanh toán và đang xử lý duyệt giữ chỗ. Nhân viên tư vấn sẽ liên hệ với bạn trong vòng 15 phút.
            </p>
            
            <div className="success-receipt-box" style={{ maxHeight: '220px', overflowY: 'auto' }}>
              <div className="receipt-row">
                <span>Khách hàng:</span>
                <span>{bookingsList[0]?.fullName}</span>
              </div>
              <div className="receipt-row">
                <span>Số điện thoại:</span>
                <span>{bookingsList[0]?.phone}</span>
              </div>
              <div className="invoice-divider" style={{ margin: '0.5rem 0' }}></div>
              {toursList.map((t: any, idx: number) => {
                const b = bookingsList[idx];
                if (!t || !b) return null;
                return (
                  <div key={b.id || idx} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>• {t.title} ({b.numberOfGuests} khách)</span>
                    <span style={{ fontWeight: 600 }}>{(t.price * b.numberOfGuests).toLocaleString('vi-VN')} đ</span>
                  </div>
                );
              })}
              <div className="invoice-divider" style={{ margin: '0.5rem 0' }}></div>
              <div className="receipt-row">
                <span>Tổng tiền:</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>{totalCost.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="receipt-row">
                <span>Trạng thái:</span>
                <span className="status-badge pending">⏳ Đang xử lý</span>
              </div>
            </div>

            <button className="btn-checkout-success-done" onClick={onClose}>
              Hoàn tất & Quay lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
