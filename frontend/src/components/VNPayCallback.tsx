import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface PaymentResult {
  status: 'SUCCESS' | 'FAILED' | 'INVALID_SIGNATURE' | 'ERROR';
  message: string;
}

export const VNPayCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PaymentResult | null>(null);

  const searchParams = new URLSearchParams(location.search);
  const bookingIds = searchParams.get('vnp_TxnRef') || '';
  const amountRaw = searchParams.get('vnp_Amount') || '0';
  const amount = (parseInt(amountRaw, 10) / 100).toLocaleString('vi-VN') + ' đ';
  const bankCode = searchParams.get('vnp_BankCode') || '';
  const payDateRaw = searchParams.get('vnp_PayDate') || '';
  
  let payDate = '';
  if (payDateRaw && payDateRaw.length === 14) {
    payDate = `${payDateRaw.substring(6, 8)}/${payDateRaw.substring(4, 6)}/${payDateRaw.substring(0, 4)} ${payDateRaw.substring(8, 10)}:${payDateRaw.substring(10, 12)}:${payDateRaw.substring(12, 14)}`;
  }

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/payment/vnpay-callback${location.search}`);
        const data = await response.json();
        setResult(data);
      } catch (error) {
        console.error('Error verifying payment signature:', error);
        setResult({
          status: 'ERROR',
          message: 'Không thể kết nối đến máy chủ để xác thực giao dịch.'
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [location.search]);

  return (
    <div className="planner-page-container page-fade" style={{ maxWidth: '650px', margin: '2rem auto', padding: '2rem' }}>
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb-container" aria-label="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/')}>Trang chủ</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-active">Xác nhận thanh toán VNPay</span>
      </nav>

      <div className="dashboard-card" style={{ padding: '3.5rem 2.5rem', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
        {loading ? (
          <>
            <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner" style={{ borderTopColor: '#e11d74', borderLeftColor: 'transparent', width: '50px', height: '50px' }}></div>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Đang xác thực giao dịch...
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Vui lòng chờ trong giây lát, chúng tôi đang liên hệ với VNPay để xác nhận giao dịch của bạn.
            </p>
          </>
        ) : (
          <>
            {result?.status === 'SUCCESS' ? (
              <>
                <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '3rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', border: '2.5px solid #10b981' }}>
                  ✓
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Thanh Toán Thành Công!
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                  {result.message || 'Giao dịch thanh toán trực tuyến qua VNPay đã hoàn tất thành công.'}
                </p>
              </>
            ) : (
              <>
                <div style={{ width: '80px', height: '80px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '3rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', border: '2.5px solid #ef4444' }}>
                  ✗
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Thanh Toán Thất Bại!
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                  {result?.message || 'Có lỗi xảy ra hoặc giao dịch đã bị hủy bỏ bởi người dùng.'}
                </p>
              </>
            )}

            {/* Bill Details */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'left', marginBottom: '2rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mã đơn đặt tour:</span>
                <strong style={{ color: 'var(--text-main)' }}>#{bookingIds}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Số tiền thanh toán:</span>
                <strong style={{ color: '#e11d74', fontSize: '1rem' }}>{amount}</strong>
              </div>
              {bankCode && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Ngân hàng giao dịch:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{bankCode}</strong>
                </div>
              )}
              {payDate && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Thời gian thực hiện:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{payDate}</strong>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button"
                className="btn-reset" 
                onClick={() => navigate('/')}
                style={{ flex: 1, padding: '0.8rem 1.5rem', cursor: 'pointer' }}
              >
                Quay về trang chủ
              </button>
              <button 
                type="button"
                className="btn-dashboard-save btn-security"
                onClick={() => navigate('/profile?tab=bookings')}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  margin: 0
                }}
              >
                Lịch sử đặt tour ➔
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
