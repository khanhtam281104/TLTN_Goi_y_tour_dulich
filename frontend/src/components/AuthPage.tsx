import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface AuthPageProps {
  onSuccess: (token: string, user: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const mode = searchParams.get('mode') || 'login';
  const isLogin = mode === 'login';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Clear errors when toggling modes
  const handleToggleMode = (newMode: 'login' | 'register') => {
    setSearchParams({ mode: newMode });
    setError('');
    setSuccessMsg('');
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Đăng nhập Google thất bại');
      }
      onSuccess(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      const g = (window as any).google;
      if (g) {
        g.accounts.id.initialize({
          client_id: "904631197165-n3mdi6ag2d4umkavj6h1vbmv9l6bbeuo.apps.googleusercontent.com",
          callback: handleGoogleCredentialResponse,
        });
        const container = document.getElementById("googleSignInButton");
        if (container) {
          g.accounts.id.renderButton(
            container,
            { theme: "outline", size: "large", width: 340, text: isLogin ? "signin_with" : "signup_with" }
          );
        }
      }
    };

    const g = (window as any).google;
    if (g && g.accounts) {
      initializeGoogleSignIn();
    } else {
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (script) {
        script.addEventListener('load', initializeGoogleSignIn);
      }
    }
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (isLogin) {
      // Login flow
      try {
        const response = await fetch('http://localhost:8080/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
        }

        onSuccess(data.token, data.user);
        navigate('/');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Register flow
      if (password !== confirmPassword) {
        setError('Mật khẩu nhập lại không khớp!');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8080/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            password,
            confirmPassword,
            fullName,
            email,
            phone,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Đăng ký thất bại.');
        }

        setSuccessMsg(data.message || 'Đăng ký thành công! Hãy đăng nhập ngay.');
        handleToggleMode('login'); // Switch to login after successful register
        // Clear fields
        setPassword('');
        setConfirmPassword('');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-page-container">
      {/* Left side: Visual Branding & Info */}
      <div className="auth-page-left">
        <div className="auth-brand" onClick={() => navigate('/')}>
          <div className="auth-logo-circle">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px' }}>
              <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255, 255, 255, 0.2)"/>
            </svg>
          </div>
          <span className="auth-logo-title">Bintravel</span>
        </div>

        <div className="auth-promo-content">
          <h1 className="promo-title">Trải Nghiệm Du Lịch Hoàn Hảo</h1>
          <p className="promo-subtitle">
            Khám phá hàng ngàn điểm đến hấp dẫn trên khắp Việt Nam với công nghệ gợi ý hành trình thông minh bằng AI tiên tiến của chúng tôi.
          </p>

          <div className="promo-features">
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <div>
                <h4>Gợi ý Tour AI</h4>
                <p>Khám phá các tour được đề xuất phù hợp riêng theo sở thích cá nhân của bạn.</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">🛡️</span>
              <div>
                <h4>An tâm đặt chỗ</h4>
                <p>Quy trình đặt tour trọn gói nhanh chóng, bảo mật thông tin tuyệt đối.</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon">🎁</span>
              <div>
                <h4>Đặc quyền thành viên</h4>
                <p>Nhận ngay ưu đãi giảm giá lên đến 40% cho các hành trình hot hè 2026.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-footer-text">
          © 2026 Bintravel. Bản quyền đã được bảo hộ.
        </div>
      </div>

      {/* Right side: Authentication Form */}
      <div className="auth-page-right">
        <button className="auth-back-home" onClick={() => navigate('/')}>
          ← Quay lại Trang chủ
        </button>

        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2 className="auth-form-title">
              {isLogin ? 'Chào Mừng Trở Lại!' : 'Đăng Ký Thành Viên'}
            </h2>
            <p className="auth-form-subtitle">
              {isLogin
                ? 'Đăng nhập vào hệ thống để tiếp tục đặt tour và xem gợi ý cá nhân hóa.'
                : 'Nhập thông tin cá nhân của bạn để tạo tài khoản mới.'}
            </p>
          </div>

          <div className="auth-page-tabs">
            <button
              type="button"
              className={`auth-page-tab-btn ${isLogin ? 'active' : ''}`}
              onClick={() => handleToggleMode('login')}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className={`auth-page-tab-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => handleToggleMode('register')}
            >
              Đăng ký
            </button>
          </div>

          {error && <div className="auth-alert error">{error}</div>}
          {successMsg && <div className="auth-alert success">{successMsg}</div>}

          <form onSubmit={handleSubmit} className="auth-form-main">
            <div className="form-group">
              <label htmlFor="page-username">Tên đăng nhập *</label>
              <input
                id="page-username"
                type="text"
                placeholder="Nhập tên đăng nhập (từ 3 ký tự)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <>
                <div className="form-group">
                  <label htmlFor="page-fullname">Họ và tên</label>
                  <input
                    id="page-fullname"
                    type="text"
                    placeholder="Nhập họ và tên của bạn"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="page-email">Email</label>
                  <input
                    id="page-email"
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="page-phone">Số điện thoại</label>
                  <input
                    id="page-phone"
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="page-password">Mật khẩu *</label>
              <input
                id="page-password"
                type="password"
                placeholder="Nhập mật khẩu (từ 6 ký tự)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="page-confirmpass">Nhập lại mật khẩu *</label>
                <input
                  id="page-confirmpass"
                  type="password"
                  placeholder="Nhập lại mật khẩu để xác nhận"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <button type="submit" className="btn-auth-page-submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Đăng ký'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '0.75rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>hoặc</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '0.5rem' }}>
              <div id="googleSignInButton"></div>
            </div>
          </form>

          <div className="auth-form-footer">
            {isLogin ? (
              <p>
                Bạn chưa có tài khoản?{' '}
                <span onClick={() => handleToggleMode('register')}>Đăng ký ngay</span>
              </p>
            ) : (
              <p>
                Bạn đã có tài khoản?{' '}
                <span onClick={() => handleToggleMode('login')}>Đăng nhập ngay</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
