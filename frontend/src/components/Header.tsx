import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  user: any;
  keyword: string;
  onKeywordChange: (val: string) => void;
  onSearch?: () => void;
  onLogout: () => void;
  onShowAuth: () => void;
  cartCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  keyword,
  onKeywordChange,
  onSearch,
  onLogout,
  onShowAuth,
  cartCount = 0,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch();
    } else {
      navigate('/');
    }
  };

  const handleLogoClick = () => {
    onKeywordChange('');
    navigate('/');
  };

  const isHome = location.pathname === '/';
  const isRecommendations = location.pathname === '/recommendations';
  const isProfile = location.pathname === '/profile';
  const isAdmin = location.pathname === '/admin';

  return (
    <div className="header-wrapper-fixed">
      {/* Top Bar (Magenta) */}
      <div className="header-top-bar">
        <div className="top-bar-left">
          <span className="hotline-label">Hotline:</span>
          <span className="hotline-number">1900 1177</span>
          <span style={{ fontSize: '0.75rem', marginLeft: '0.2rem' }}>▼</span>
        </div>

        <div className="top-bar-middle">
          <form onSubmit={handleSearchSubmit} className="header-search-box">
            <input
              type="text"
              className="header-search-input"
              placeholder="Bạn muốn đi du lịch ở đâu?"
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
            />
            <button type="submit" className="header-search-btn" title="Tìm kiếm">
              🔍
            </button>
          </form>
        </div>

        <div className="top-bar-right">
          <span className="top-bar-link" onClick={() => navigate('/gop-y')}>
            📝 Phiếu góp ý
          </span>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span 
                className="top-bar-link" 
                style={{ fontWeight: 700, color: '#fef08a' }}
                onClick={() => navigate('/profile')}
              >
                👤 {user.fullName || user.username}
              </span>
            </div>
          ) : (
            <span className="top-bar-link" onClick={onShowAuth}>
              👤 Đăng nhập
            </span>
          )}
          
          <div className="cart-icon-wrapper" style={{ cursor: 'pointer' }} onClick={() => navigate('/cart')}>
            <span style={{ fontSize: '1.25rem' }}>🛒</span>
            <span className="cart-badge-count">{cartCount}</span>
          </div>
        </div>
      </div>

      {/* Main Nav Bar (White) */}
      <header className="header-nav-bar">
        <div onClick={handleLogoClick} className="nav-bar-logo-link" style={{ cursor: 'pointer' }}>
          <div className="nav-logo-circle">
            <span>✈️</span>
          </div>
          <div className="nav-logo-text-wrapper">
            <span className="nav-logo-title">dulichviet</span>
            <span className="nav-logo-subtitle">viet media travel</span>
          </div>
        </div>

        <nav className="nav-menu-links">
          <Link 
            to="/" 
            className={`nav-menu-item-link ${isHome ? 'active-link' : ''}`}
            onClick={() => onKeywordChange('')}
          >
            TOUR
          </Link>
          <Link 
            to="/recommendations" 
            className={`nav-menu-item-link ${isRecommendations ? 'active-link' : ''}`}
          >
            Gợi ý Tour AI
          </Link>
          <Link 
            to="/planner" 
            className={`nav-menu-item-link ${location.pathname === '/planner' ? 'active-link' : ''}`}
          >
            Tự lập lịch trình & Chi tiêu
          </Link>
        </nav>

        <div className="nav-user-control">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {user.role === 'ADMIN' && (
                <button 
                  className={`nav-btn-action ${isAdmin ? 'active-btn' : ''}`} 
                  onClick={() => navigate('/admin')}
                >
                  🛠️ Admin
                </button>
              )}
              <button 
                className={`nav-btn-action ${isProfile ? 'active-btn' : ''}`} 
                onClick={() => navigate('/profile')}
              >
                ⚙️ Tài khoản
              </button>
              <button className="nav-btn-logout" onClick={onLogout}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <button className="btn-nav-login" onClick={onShowAuth}>
              🔑 Đăng nhập / Đăng ký
            </button>
          )}
        </div>
      </header>
    </div>
  );
};
