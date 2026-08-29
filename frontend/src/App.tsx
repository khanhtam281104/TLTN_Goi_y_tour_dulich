import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { TourCard } from './components/TourCard';
import type { Tour } from './components/TourCard';
import { AuthPage } from './components/AuthPage';
import { UserProfileDashboard } from './components/UserProfileDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ChatbotWidget } from './components/ChatbotWidget';
import { TourDetailPage } from './components/TourDetailPage';
import { TourRecommendationsPage } from './components/TourRecommendationsPage';
import { TripPlanner } from './components/TripPlanner';
import { FeedbackPage } from './components/FeedbackPage';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { Footer } from './components/Footer';

import { CartPage } from './components/CartPage';

export interface CartItem {
  id: string;
  tour: Tour;
  departureDate: string;
  numberOfGuests: number;
  notes: string;
}

const API_BASE_URL = 'http://localhost:8080/api/tours';

function App() {
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const [tours, setTours] = useState<Tour[]>([]);

  // Scroll to top on every route/page transition
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [routeLocation.pathname]);
  const [recommendations, setRecommendations] = useState<Tour[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  
  // Auth States
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  // Filter States
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  // Cart States
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    const id = `${item.tour.id}_${item.departureDate}`;
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing) {
        return prev.map(i => i.id === id ? { ...i, numberOfGuests: i.numberOfGuests + item.numberOfGuests } : i);
      }
      return [...prev, { ...item, id }];
    });
  };

  const updateCartQty = (id: string, qty: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, numberOfGuests: Math.max(1, qty) } : i));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const fetchCartCount = () => {};

  useEffect(() => {
    fetchCartCount();
  }, [token]);

  // Favorite States
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  const fetchFavoriteIds = () => {
    if (token) {
      fetch('http://localhost:8080/api/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setFavoriteIds(data.map((t: any) => t.id));
          }
        })
        .catch(err => console.error("Error fetching favorites:", err));
    } else {
      setFavoriteIds([]);
    }
  };

  useEffect(() => {
    fetchFavoriteIds();
  }, [token]);

  const handleToggleFavorite = async (tourId: number) => {
    if (!token) {
      alert('Vui lòng đăng nhập để sử dụng tính năng yêu thích!');
      navigate('/auth?mode=login');
      return;
    }
    try {
      const res = await fetch(`http://localhost:8080/api/favorites/toggle/${tourId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.isFavorite) {
          setFavoriteIds(prev => [...prev, tourId]);
        } else {
          setFavoriteIds(prev => prev.filter(id => id !== tourId));
        }
      } else {
        alert(data.message || 'Lỗi khi cập nhật danh sách yêu thích');
      }
    } catch (err) {
      console.error("Lỗi khi thay đổi trạng thái yêu thích:", err);
    }
  };


  // Fetch unique locations on startup
  useEffect(() => {
    fetch(`${API_BASE_URL}/locations`)
      .then(res => res.json())
      .then(data => setLocations(data))
      .catch(err => console.error("Error fetching locations:", err));
  }, []);

  // Listen to search query parameter changes (e.g. from Footer links)
  useEffect(() => {
    const params = new URLSearchParams(routeLocation.search);
    const kw = params.get('keyword');
    if (kw !== null) {
      setKeyword(kw);
      setCategory('');
      setLocation('');
      setMaxPrice('');
    }
  }, [routeLocation.search]);

  // Fetch personalized recommendations when token or user preferences change
  useEffect(() => {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(`${API_BASE_URL}/recommendations?limit=5`, { headers })
      .then(res => res.json())
      .then(data => setRecommendations(data))
      .catch(err => console.error("Error fetching recommendations:", err));
  }, [token, user?.favoriteCategory, user?.favoriteLocation]);

  // Fetch filtered tours when filter states change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (category) params.append('category', category);
    if (location) params.append('location', location);
    if (maxPrice) params.append('maxPrice', maxPrice.toString());

    fetch(`${API_BASE_URL}?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setTours(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching tours:", err);
        setLoading(false);
      });
  }, [keyword, category, location, maxPrice]);

  const handleResetFilters = () => {
    setKeyword('');
    setCategory('');
    setLocation('');
    setMaxPrice('');
  };

  const handleAuthSuccess = (newToken: string, loggedInUser: any) => {
    setToken(newToken);
    setUser(loggedInUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('http://localhost:8080/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Error logging out:", err);
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/');
  };

  const [currentPage, setCurrentPage] = useState(1);
  const toursPerPage = 12;
  const totalPages = Math.ceil(tours.length / toursPerPage);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, category, location, maxPrice]);

  const displayedTours = tours.slice(
    (currentPage - 1) * toursPerPage,
    currentPage * toursPerPage
  );

  return (
    <div className="app-container">
      {/* Remodeled Header (Magenta double-row layout) */}
      <Header
        user={user}
        keyword={keyword}
        onKeywordChange={setKeyword}
        onSearch={() => {
          setCategory('');
          setLocation('');
          setMaxPrice('');
          navigate('/');
        }}
        onLogout={handleLogout}
        onShowAuth={() => navigate('/auth?mode=login')}
        cartCount={cart.length}
      />

      {/* Main Container */}
      <main className="main-content" style={{ marginTop: '1.5rem' }}>
        <Routes>
          <Route path="/" element={
            <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {/* Summer Travel Hero Banner Slider */}
              <HeroBanner 
                onSelectDestination={setKeyword} 
                featuredTours={tours.filter(t => t.imageUrl && (
                  t.title.toLowerCase().includes("phú quốc") || 
                  t.title.toLowerCase().includes("đà lạt") || 
                  t.title.toLowerCase().includes("hạ long") ||
                  t.title.toLowerCase().includes("bến tre") ||
                  t.title.toLowerCase().includes("sapa")
                )).slice(0, 4)} 
              />

              {/* Recommendation Slider */}
              {recommendations.length > 0 && (
                <section className="recommend-section">
                  <h2 className="section-title">
                    <span className="spark">✨</span> {user ? 'Gợi ý cá nhân hóa dành riêng cho bạn' : 'Gợi ý nổi bật dành cho bạn'}
                  </h2>
                  <div className="recommend-slider">
                    {recommendations.map(tour => (
                      <div key={tour.id} style={{ minWidth: '320px', maxWidth: '320px' }}>
                        <TourCard tour={tour} isFavorite={favoriteIds.includes(tour.id)} onToggleFavorite={handleToggleFavorite} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Dashboard Grid */}
              <section className="dashboard-grid">
                
                {/* Sidebar Filters */}
                <aside className="filters-sidebar">
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                    Bộ lọc Tìm kiếm
                  </h3>
                  
                  {/* Search Keyword */}
                  <div className="filter-group">
                    <label>Tìm tên tour hoặc địa danh</label>
                    <input 
                      type="text" 
                      className="filter-input" 
                      placeholder="Ví dụ: Phú Quốc, Sapa..."
                      value={keyword}
                      onChange={e => setKeyword(e.target.value)}
                    />
                  </div>

                  {/* Category Select */}
                  <div className="filter-group">
                    <label>Phân loại tour</label>
                    <select 
                      className="filter-select"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                    >
                      <option value="">Tất cả các loại</option>
                      <option value="Trong nước">📍 Trong nước</option>
                      <option value="Nước ngoài">✈️ Nước ngoài</option>
                    </select>
                  </div>

                  {/* Location Select */}
                  <div className="filter-group">
                    <label>Điểm đến phổ biến</label>
                    <select 
                      className="filter-select"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                    >
                      <option value="">Tất cả điểm đến</option>
                      {locations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  {/* Max Price Select */}
                  <div className="filter-group">
                    <label>Ngân sách tối đa</label>
                    <select 
                      className="filter-select"
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                    >
                      <option value="">Mọi mức giá</option>
                      <option value="2000000">Dưới 2.000.000 đ</option>
                      <option value="5000000">Dưới 5.000.000 đ</option>
                      <option value="10000000">Dưới 10.000.000 đ</option>
                      <option value="20000000">Dưới 20.000.000 đ</option>
                    </select>
                  </div>

                  {/* Reset Button */}
                  <button className="btn-reset" onClick={handleResetFilters}>
                    Clear Filters
                  </button>
                </aside>

                {/* Results Grid */}
                <div className="tours-container">
                  <div className="results-info">
                    <div>
                      Hiện có <strong>{tours.length}</strong> tour khả dụng
                    </div>
                    {loading && <div style={{ color: 'var(--primary)' }}>Đang tìm kiếm...</div>}
                  </div>

                  {tours.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">🔍</div>
                      <h3>Không tìm thấy kết quả phù hợp</h3>
                      <p>Hãy thử xóa bộ lọc hoặc tìm kiếm bằng từ khóa khác xem sao nhé!</p>
                    </div>
                  ) : (
                    <>
                      <div className="tours-grid">
                        {displayedTours.map(tour => (
                          <TourCard key={tour.id} tour={tour} isFavorite={favoriteIds.includes(tour.id)} onToggleFavorite={handleToggleFavorite} />
                        ))}
                      </div>

                      {totalPages > 1 && (
                        <div className="pagination-container">
                          <button 
                            className="pagination-btn"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            &laquo; Trang trước
                          </button>
                          
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum = i + 1;
                            if (currentPage > 3 && totalPages > 5) {
                              if (currentPage + 2 <= totalPages) {
                                pageNum = currentPage - 3 + i + 1;
                              } else {
                                pageNum = totalPages - 5 + i + 1;
                              }
                            }
                            return (
                              <button
                                key={pageNum}
                                className={`pagination-number-btn ${currentPage === pageNum ? 'active' : ''}`}
                                onClick={() => setCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          {totalPages > 5 && currentPage + 2 < totalPages && (
                            <>
                              <span className="pagination-ellipsis">...</span>
                              <button
                                className="pagination-number-btn"
                                onClick={() => setCurrentPage(totalPages)}
                              >
                                {totalPages}
                              </button>
                            </>
                          )}

                          <button 
                            className="pagination-btn"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                          >
                            Trang sau &raquo;
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>
            </div>
          } />

          <Route path="/tour/:id" element={
            <TourDetailPage
              token={token}
              currentUser={user}
              addToCart={addToCart}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
            />
          } />

          <Route path="/recommendations" element={
            <TourRecommendationsPage
              user={user}
              token={token}
              locations={locations}
              onClose={() => navigate('/')}
              onUpdateUser={(updatedUser) => {
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
              }}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
            />
          } />

          <Route path="/cart" element={
            <CartPage
              cart={cart}
              updateCartQty={updateCartQty}
              removeFromCart={removeFromCart}
              clearCart={clearCart}
              token={token}
              currentUser={user}
            />
          } />

          <Route path="/planner" element={
            <div className="planner-page-container page-fade" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
              {/* Breadcrumb Navigation */}
              <nav className="breadcrumb-container" aria-label="breadcrumb">
                <span className="breadcrumb-link" onClick={() => navigate('/')}>Trang chủ</span>
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-active">Tự lập lịch trình & Chi tiêu</span>
              </nav>

              <div style={{ marginBottom: '1.5rem' }}>
                <h2 className="dashboard-title" style={{ color: '#e11d74' }}>Lập Kế Hoạch Chuyến Đi & Quản Lý Chi Tiêu</h2>
              </div>
              
              {token ? (
                <TripPlanner token={token} />
              ) : (
                <div className="empty-state" style={{ padding: '6rem 2rem', background: 'rgba(18, 18, 30, 0.7)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div className="empty-state-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                  <h3>Yêu cầu Đăng nhập</h3>
                  <p>Vui lòng đăng nhập tài khoản để có thể tự thiết kế lịch trình du lịch tự túc và theo dõi các khoản chi phí.</p>
                  <button 
                    className="btn-header-admin" 
                    onClick={() => navigate('/profile')} 
                    style={{ marginTop: '1.5rem', padding: '0.75rem 2rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px' }}
                  >
                    Đi tới Đăng nhập / Đăng ký
                  </button>
                </div>
              )}
            </div>
          } />

          <Route path="/profile" element={
            user ? (
              <UserProfileDashboard
                user={user}
                token={token || ''}
                locations={locations}
                onUpdateUser={(updatedUser) => {
                  setUser(updatedUser);
                  localStorage.setItem('user', JSON.stringify(updatedUser));
                }}
                onClose={() => navigate('/')}
                onToggleFavorite={handleToggleFavorite}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } />

          <Route path="/gop-y" element={
            <FeedbackPage user={user} />
          } />

          <Route path="/admin" element={
            user && user.role === 'ADMIN' ? (
              <AdminDashboard
                token={token || ''}
                currentUser={user}
                onClose={() => navigate('/')}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } />

          <Route path="/auth" element={
            <AuthPage onSuccess={handleAuthSuccess} />
          } />
        </Routes>
      </main>

      {/* Floating Chatbot Assistant */}
      <ChatbotWidget />

      {/* Remodeled Footer Info Listing */}
      <Footer />
    </div>
  );
}

export default App;


