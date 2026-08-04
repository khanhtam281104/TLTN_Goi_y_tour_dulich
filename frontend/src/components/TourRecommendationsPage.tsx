import React, { useState, useEffect } from 'react';
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

interface TourRecommendationsPageProps {
  user: User | null;
  token: string | null;
  locations: string[];
  onClose: () => void;
  onUpdateUser?: (updatedUser: User) => void;
  favoriteIds?: number[];
  onToggleFavorite?: (tourId: number) => void;
}

export const TourRecommendationsPage: React.FC<TourRecommendationsPageProps> = ({
  user,
  token,
  onClose,
  favoriteIds = [],
  onToggleFavorite,
}) => {
  const [activeTab, setActiveTab] = useState<'personalized' | 'aiSearch'>('aiSearch');
  
  // AI Search & Chat Suggestion states
  const [aiQuery, setAiQuery] = useState('');
  const [aiResultTours, setAiResultTours] = useState<Tour[]>([]);
  const [aiResultResponse, setAiResultResponse] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleAiSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setLoadingAi(true);
    setAiResultTours([]);
    setAiResultResponse('');
    setHasSearched(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: aiQuery.trim() }),
      });
      const data = await response.json();
      
      if (response.ok) {
        setAiResultResponse(data.response);
        const mappedTours: Tour[] = (data.tours || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          price: t.price,
          duration: t.duration,
          location: t.location,
          category: t.category,
          imageUrl: t.imageUrl,
          tourUrl: t.tourUrl,
          tags: t.tags || ""
        }));
        setAiResultTours(mappedTours);
      } else {
        setAiResultResponse(data.response || 'Đã xảy ra lỗi khi kết nối với máy chủ AI.');
      }
    } catch (err) {
      console.error(err);
      setAiResultResponse('Không thể kết nối với máy chủ gợi ý AI. Hãy đảm bảo server Python (port 5000) đã được khởi động.');
    } finally {
      setLoadingAi(false);
    }
  };
  
  // Personalized recommendations states
  const [personalRecs, setPersonalRecs] = useState<Tour[]>([]);
  const [loadingPersonal, setLoadingPersonal] = useState(false);





  // Fetch personalized recommendations
  useEffect(() => {
    if (token) {
      setLoadingPersonal(true);
      fetch('http://localhost:8080/api/tours/recommendations?limit=8', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setPersonalRecs(data);
          setLoadingPersonal(false);
        })
        .catch(err => {
          console.error('Error fetching personal recommendations:', err);
          setLoadingPersonal(false);
        });
    }
  }, [token, user?.favoriteCategory, user?.favoriteLocation]);



  return (
    <div className="recommendations-page-container">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb-container" aria-label="breadcrumb">
        <span className="breadcrumb-link" onClick={onClose}>Trang chủ</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-active">Gợi ý Tour AI</span>
      </nav>

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="dashboard-title" style={{ color: '#e11d74' }}>Trợ Lý Gợi Ý Tour Thông Minh (AI Tour Suggestion)</h2>
        <p className="dashboard-subtitle">
          Tìm kiếm hành trình du lịch tối ưu được thiết kế riêng dựa trên ngân sách, sở thích và phân tích dữ liệu AI.
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="admin-tabs" style={{ marginBottom: '2rem' }}>
        <button 
          className={`admin-tab-btn ${activeTab === 'aiSearch' ? 'active' : ''}`}
          onClick={() => setActiveTab('aiSearch')}
        >
          🔍 Tư vấn Tour AI (Hỏi Đáp)
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'personalized' ? 'active' : ''}`}
          onClick={() => setActiveTab('personalized')}
        >
          💡 Gợi ý cá nhân hóa từ Hồ sơ
        </button>
      </div>

      {/* Tab 3: AI Search & Natural Language Consultation */}
      {activeTab === 'aiSearch' && (
        <div className="ai-search-tab">
          <div className="dashboard-card" style={{ maxWidth: '800px', margin: '0 auto 2rem auto', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>
              🤖 Trợ Lý Tư Vấn Tour AI Thông Minh
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Hãy nhập yêu cầu, sở thích du lịch và ngân sách của bạn. Trí tuệ nhân tạo sẽ tự động phân tích và đề xuất hành trình tối ưu.
            </p>
            
            <form onSubmit={handleAiSearchSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                className="filter-select"
                placeholder="Ví dụ: tôi có 12 triệu cho 4 người muốn đi du lịch biển..."
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-main)' }}
              />
              <button
                type="submit"
                className="btn-header-admin"
                disabled={loadingAi}
                style={{ margin: 0, padding: '0.75rem 2rem', background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: 'white', border: 'none', fontWeight: 700, borderRadius: '8px' }}
              >
                {loadingAi ? 'Đang phân tích...' : '⚡ Phân tích AI'}
              </button>
            </form>

          </div>

          {loadingAi && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div className="spinner" style={{ borderTopColor: 'var(--primary)', margin: '0 auto' }}></div>
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>🤖 AI đang phân tích dữ liệu, tách lọc ngân sách và sắp xếp tour du lịch...</p>
            </div>
          )}

          {!loadingAi && hasSearched && (
            <div className="ai-search-results" style={{ marginTop: '2rem' }}>
              <div className="dashboard-card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--primary)', padding: '1.25rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🔮</span> Ý kiến tư vấn của Trợ Lý AI:
                </h4>
                <p style={{ fontSize: '1.05rem', color: 'var(--text-main)', lineHeight: '1.6', margin: 0, fontWeight: 500 }}>
                  {aiResultResponse}
                </p>
              </div>

              {aiResultTours.length === 0 ? (
                <div className="empty-state" style={{ padding: '4rem 2rem' }}>
                  <div className="empty-state-icon">🔍</div>
                  <h3>Không tìm thấy tour phù hợp yêu cầu</h3>
                  <p>Các bộ lọc của bạn có thể đang hơi khắt khe. Hãy thử thay đổi nội dung mô tả hoặc khoảng giá xem sao nhé!</p>
                </div>
              ) : (
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                    🔥 Danh sách tour đề xuất tối ưu ({aiResultTours.length})
                  </h3>
                  <div className="tours-grid">
                    {aiResultTours.map(tour => (
                      <TourCard 
                        key={tour.id} 
                        tour={tour} 
                        isFavorite={favoriteIds.includes(tour.id)} 
                        onToggleFavorite={onToggleFavorite} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 1: Personalized recommendations from DB */}
      {activeTab === 'personalized' && (
        <div className="personalized-recs-tab">
          <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
            <h3 className="card-heading">⚙️ Sở thích cá nhân hiện tại</h3>
            {user ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '0.75rem' }}>
                <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block' }}>Loại hình Tour ưa thích:</span>
                  <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
                    {user.favoriteCategory ? `✈️ ${user.favoriteCategory}` : 'Chưa thiết lập'}
                  </strong>
                </div>
                <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block' }}>Địa danh muốn đến nhất:</span>
                  <strong style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>
                    {user.favoriteLocation ? `📍 ${user.favoriteLocation}` : 'Chưa thiết lập'}
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '1rem', maxWidth: '300px' }}>
                    Hệ thống tự động đồng bộ kết quả gợi ý dựa trên cài đặt này. Bạn có thể thay đổi trong phần Cài đặt tài khoản.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ padding: '0.5rem 0' }}>
                <p style={{ color: 'var(--text-muted)' }}>
                  🔒 Đăng nhập ngay để kích hoạt tính năng lưu hồ sơ sở thích cá nhân hóa thông minh lâu dài.
                </p>
              </div>
            )}
          </div>

          {loadingPersonal ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner" style={{ borderTopColor: 'var(--primary)' }}></div>
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Đang tìm kiếm tour phù hợp nhất...</p>
            </div>
          ) : !token ? (
            <div className="empty-state" style={{ padding: '4rem 2rem' }}>
              <div className="empty-state-icon">🔑</div>
              <h3>Bạn chưa đăng nhập</h3>
              <p>Hãy đăng nhập tài khoản của bạn để hệ thống phân tích lịch sử, lưu hồ sơ sở thích và đưa ra các gợi ý cá nhân hóa chính xác.</p>
            </div>
          ) : personalRecs.length === 0 ? (
            <div className="empty-state" style={{ padding: '4rem 2rem' }}>
              <div className="empty-state-icon">💡</div>
              <h3>Không tìm thấy tour phù hợp sở thích</h3>
              <p>Hãy cập nhật địa điểm hoặc loại hình ưa thích trong phần cài đặt Hồ sơ cá nhân của bạn để nhận gợi ý!</p>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
                🔥 Các Tour gợi ý dành riêng cho bạn ({personalRecs.length})
              </h3>
              <div className="tours-grid">
                {personalRecs.map(tour => (
                  <TourCard 
                    key={tour.id} 
                    tour={tour} 
                    isFavorite={favoriteIds.includes(tour.id)} 
                    onToggleFavorite={onToggleFavorite} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
