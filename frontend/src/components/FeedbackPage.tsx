import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
}

interface FeedbackPageProps {
  user: User | null;
}

export const FeedbackPage: React.FC<FeedbackPageProps> = ({ user }) => {
  const navigate = useNavigate();

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('Ý kiến đóng góp dịch vụ');
  const [content, setContent] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill form if user is logged in or if query parameters are present
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.username || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }

    const params = new URLSearchParams(window.location.search);
    const queryTitle = params.get('title');
    const queryContent = params.get('content');
    if (queryTitle) {
      setTitle(queryTitle);
    }
    if (queryContent) {
      setContent(queryContent);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    if (!fullName.trim() || !content.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ Họ tên và Nội dung góp ý.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        fullName,
        email,
        phone,
        title,
        content
      };

      const response = await fetch('http://localhost:8080/api/feedbacks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg('Cảm ơn đóng góp quý giá của bạn! Ý kiến đã được gửi tới Ban quản trị hệ thống.');
        setContent('');
      } else {
        setErrorMsg(data.message || 'Gửi ý kiến đóng góp thất bại. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Lỗi kết nối máy chủ. Vui lòng kiểm tra lại đường truyền.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="planner-page-container page-fade" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb-container" aria-label="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/')}>Trang chủ</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-active">Đóng góp ý kiến</span>
      </nav>

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="dashboard-title" style={{ color: '#e11d74' }}>Đóng góp ý kiến</h2>
      </div>

      <div className="dashboard-card" style={{ padding: '2.5rem', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#e11d74' }}>
          Gửi Ý Kiến Đóng Góp Dịch Vụ
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Mọi ý kiến đóng góp của quý khách sẽ giúp chúng tôi nâng cao chất lượng dịch vụ gợi ý tour và chăm sóc khách hàng tốt hơn.
        </p>

        {successMsg && <div className="auth-alert success" style={{ marginBottom: '1.5rem' }}>✅ {successMsg}</div>}
        {errorMsg && <div className="auth-alert error" style={{ marginBottom: '1.5rem' }}>❌ {errorMsg}</div>}

        <form onSubmit={handleSubmit} className="dashboard-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="form-group">
            <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Họ và tên quý khách *</label>
            <input 
              type="text" 
              className="filter-select"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Nhập họ và tên đầy đủ"
              style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)' }}
              required
            />
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Địa chỉ Email</label>
              <input 
                type="email" 
                className="filter-select"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Số điện thoại</label>
              <input 
                type="tel" 
                className="filter-select"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại liên hệ"
                style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Chủ đề đóng góp *</label>
            <select
              className="filter-select"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)' }}
            >
              <option value="Ý kiến đóng góp dịch vụ">Ý kiến đóng góp dịch vụ gợi ý</option>
              <option value="Báo lỗi kỹ thuật hệ thống">Báo lỗi kỹ thuật hệ thống</option>
              <option value="Đóng góp về nội dung tour">Đóng góp về nội dung và chất lượng tour</option>
              <option value="Yêu cầu hỗ trợ đặc biệt">Yêu cầu hỗ trợ đặc biệt</option>
              <option value="Yêu cầu tư vấn đặt Tour">Yêu cầu tư vấn đặt Tour (Tour Liên hệ)</option>
              <option value="Khác">Chủ đề khác</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Chi tiết nội dung góp ý *</label>
            <textarea 
              rows={6}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Nhập nội dung góp ý chi tiết của bạn tại đây..."
              style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-primary)',
                padding: '0.75rem',
                outline: 'none',
                resize: 'vertical'
              }}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-dashboard-save btn-security" 
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem', fontWeight: 700, fontSize: '1rem', background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '0.5rem' }}
          >
            {loading ? 'Đang gửi ý kiến đóng góp...' : 'Gửi đóng góp ý kiến'}
          </button>
        </form>
      </div>
    </div>
  );
};
