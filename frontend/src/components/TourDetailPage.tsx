import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckoutModal } from './CheckoutModal';

interface Tour {
  id: number;
  title: string;
  price: number;
  duration: string;
  location: string;
  category: string;
  imageUrl: string;
  tourUrl: string;
  description?: string;
  tags?: string;
  departureDates?: string;
}

interface DepartureSchedule {
  date: string;
  spec: string;
  price: string;
  seats: string;
}

interface TourDetailPageProps {
  tour?: Tour;
  token: string | null;
  currentUser: any;
  onClose?: () => void;
  addToCart?: (item: any) => void;
  favoriteIds?: number[];
  onToggleFavorite?: (tourId: number) => void;
}

export const TourDetailPage: React.FC<TourDetailPageProps> = ({
  tour,
  token,
  currentUser,
  onClose,
  addToCart,
  favoriteIds = [],
  onToggleFavorite,
}) => {
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [localTour, setLocalTour] = useState<Tour | null>(tour || null);
  const [fetchingTour, setFetchingTour] = useState(!tour);
  const [fetchError, setFetchError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  // Check if tour is favorited by current user
  useEffect(() => {
    if (localTour) {
      if (onToggleFavorite && favoriteIds) {
        setIsFavorite(favoriteIds.includes(localTour.id));
      } else if (token) {
        fetch(`http://localhost:8080/api/favorites/check/${localTour.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => setIsFavorite(!!data.isFavorite))
          .catch(err => console.error('Error checking favorite status:', err));
      }
    }
  }, [localTour, token, favoriteIds, onToggleFavorite]);

  const handleToggleFavorite = async () => {
    if (!token) {
      alert('Vui lòng đăng nhập để sử dụng tính năng yêu thích!');
      return;
    }
    if (!localTour) return;
    if (onToggleFavorite) {
      onToggleFavorite(localTour.id);
    } else {
      try {
        const res = await fetch(`http://localhost:8080/api/favorites/toggle/${localTour.id}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setIsFavorite(!!data.isFavorite);
        }
      } catch (err) {
        console.error('Lỗi kết nối khi yêu thích tour:', err);
      }
    }
  };

  // Form Booking states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [notes, setNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  // Structured departures states
  const [structuredDepartures, setStructuredDepartures] = useState<DepartureSchedule[]>([]);
  const [isStructured, setIsStructured] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);

  const isContactOnly = 
    (localTour?.price === 0) ||
    (departureDate !== '' && (
      departureDate.toLowerCase().includes('liên hệ') || 
      departureDate.toLowerCase().includes('lien he') ||
      departureDate.includes(',') ||
      (!/\d/.test(departureDate))
    ));

  // Scroll to top on load/change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Fetch tour by ID when the URL id parameter changes
  useEffect(() => {
    if (id) {
      setFetchingTour(true);
      setFetchError('');
      fetch(`http://localhost:8080/api/tours/${id}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error('Không tìm thấy thông tin tour này.');
          }
          return res.json();
        })
        .then((data) => {
          setLocalTour(data);
          setFetchingTour(false);
        })
        .catch((err) => {
          console.error(err);
          setFetchError(err.message || 'Lỗi khi tải thông tin tour.');
          setFetchingTour(false);
        });
    } else if (tour) {
      setLocalTour(tour);
      setFetchingTour(false);
    }
  }, [id, tour]);

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || currentUser.username || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  // Parse crawled departure dates (fallback format)
  const parseDepartureDates = (datesStr?: string): string[] => {
    if (!datesStr || datesStr.trim() === 'N/A') return [];
    const list: string[] = [];
    try {
      let year = '2026';
      const yearMatch = datesStr.match(/(\d{4})$/);
      if (yearMatch) {
        year = yearMatch[1];
      }

      const segments = datesStr.split(';');
      for (let seg of segments) {
        seg = seg.trim();
        if (!seg) continue;
        seg = seg.replace(/\/\d{4}$/, ''); // strip year from segment end

        const slashIdx = seg.indexOf('/');
        if (slashIdx !== -1) {
          const daysStr = seg.substring(0, slashIdx);
          const month = seg.substring(slashIdx + 1).trim();
          const days = daysStr.split(',');
          for (let day of days) {
            const cleanDay = day.trim();
            if (cleanDay) {
              list.push(`${cleanDay}/${month}/${year}`);
            }
          }
        } else {
          list.push(seg);
        }
      }
    } catch (e) {
      console.error('Error parsing departure dates:', e);
    }
    return list;
  };

  const parsedFallbackDates = parseDepartureDates(localTour?.departureDates);

  // Initialize and check if structured JSON
  useEffect(() => {
    if (localTour?.departureDates) {
      try {
        const parsed = JSON.parse(localTour.departureDates);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].date) {
          setStructuredDepartures(parsed);
          setIsStructured(true);
          setDepartureDate(parsed[0].date);
          setSelectedPrice(parsed[0].price);
          return;
        }
      } catch (e) {
        // Not a JSON, fall back to simple string parsing
      }
    }
    setIsStructured(false);
    if (parsedFallbackDates.length > 0) {
      setDepartureDate(parsedFallbackDates[0]);
    }
    setSelectedPrice(null);
  }, [localTour?.departureDates]);

  const handleSelectScheduleRow = (sched: DepartureSchedule) => {
    setDepartureDate(sched.date);
    setSelectedPrice(sched.price);
    // Smooth scroll to booking form on mobile
    const sidebar = document.querySelector('.tour-booking-sidebar-card');
    if (sidebar) {
      sidebar.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!localTour) return;

    if (isContactOnly) {
      setShowContactModal(true);
      return;
    }

    if (!departureDate) {
      setErrorMsg('Vui lòng chọn ngày khởi hành.');
      return;
    }

    if (addToCart) {
      addToCart({
        tour: localTour,
        departureDate,
        numberOfGuests,
        notes: notes || '',
      });
      setShowSuccessDialog(true);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Liên hệ';
    return price.toLocaleString('vi-VN') + ' đ';
  };

  const handleGoBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  if (fetchingTour) {
    return (
      <div className="tour-detail-page-container page-fade" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 600 }}>Đang tải thông tin chi tiết tour...</div>
      </div>
    );
  }

  if (fetchError || !localTour) {
    return (
      <div className="tour-detail-page-container page-fade" style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="auth-alert error" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
          {fetchError || 'Không thể tìm thấy tour du lịch yêu cầu.'}
        </div>
        <button className="btn-back" onClick={handleGoBack}>
          ← Quay lại
        </button>
      </div>
    );
  }

  const getSubCategory = () => {
    if (localTour && localTour.tags) {
      const splitTags = localTour.tags.split(/[;,]/).map(t => t.trim()).filter(Boolean);
      if (splitTags.length > 0) {
        const first = splitTags[0];
        return first.charAt(0).toUpperCase() + first.slice(1);
      }
    }
    return 'Tour xe giá sốc';
  };

  return (
    <div className="tour-detail-page-container page-fade">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb-container" aria-label="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/')}>Trang chủ</span>
        <span className="breadcrumb-separator">›</span>
        <span 
          className="breadcrumb-link" 
          onClick={() => navigate('/')}
        >
          {localTour.category === 'Trong nước' ? 'Du lịch Trong Nước' : 
           localTour.category === 'Nước ngoài' ? 'Du lịch Nước Ngoài' : 
           localTour.category || 'Du lịch'}
        </span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-link" onClick={() => navigate('/')}>
          {getSubCategory()}
        </span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-active" title={localTour.title}>
          {localTour.title}
        </span>
      </nav>

      <div className="tour-detail-page-layout">
        {/* Left Column: Extensive Tour Information */}
        <div className="tour-info-main-card">
          <div className="tour-banner-wrapper">
            <img 
              src={localTour.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200'} 
              alt={localTour.title} 
              className="tour-banner-img"
            />
            <span className={`card-badge ${localTour.category === 'Trong nước' ? 'domestic' : 'intl'}`}>
              {localTour.category === 'Trong nước' ? '📍 Trong nước' : '✈️ Nước ngoài'}
            </span>
          </div>

          <h1 className="tour-title-large" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <span>{localTour.title}</span>
            <button 
              type="button"
              onClick={handleToggleFavorite}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                cursor: 'pointer',
                width: '45px',
                height: '45px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: isFavorite ? '#ef4444' : '#9ca3af',
                transition: 'all 0.2s ease',
                outline: 'none',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              title={isFavorite ? 'Xóa khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
          </h1>

          <div className="tour-quick-specs">
            <div className="spec-item">
              <span className="spec-icon">📍</span>
              <div>
                <span className="spec-label">Điểm đến</span>
                <span className="spec-value">{localTour.location}</span>
              </div>
            </div>
            <div className="spec-item">
              <span className="spec-icon">⏱️</span>
              <div>
                <span className="spec-label">Thời lượng</span>
                <span className="spec-value">{localTour.duration}</span>
              </div>
            </div>
            <div className="spec-item">
              <span className="spec-icon">💳</span>
              <div>
                <span className="spec-label">Giá trọn gói</span>
                <span className="spec-value price-color">
                  {selectedPrice ? selectedPrice : formatPrice(localTour.price)}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Departure Schedule Table */}
          {isStructured && structuredDepartures.length > 0 && (
            <div className="tour-detailed-content departure-schedule-block">
              <h3 style={{ borderLeft: '3px solid #10b981', paddingLeft: '0.5rem', color: '#10b981' }}>
                📅 Lịch khởi hành thời gian thực (Cập nhật trực tuyến)
              </h3>
              <div className="expenses-list-wrapper" style={{ maxHeight: 'none', marginTop: '0.85rem' }}>
                <table className="expense-table departure-table-full">
                  <thead>
                    <tr>
                      <th style={{ width: '50px', textAlign: 'center' }}>STT</th>
                      <th>Ngày khởi hành</th>
                      <th>Đặc điểm phương tiện / Tần suất</th>
                      <th style={{ textAlign: 'right' }}>Giá từ</th>
                      <th style={{ textAlign: 'center' }}>Số Chỗ</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {structuredDepartures.map((sched, index) => {
                      const isSelected = departureDate === sched.date;
                      return (
                        <tr 
                          key={index} 
                          className={`departure-row-item ${isSelected ? 'selected-row' : ''}`}
                        >
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>📅 {sched.date}</td>
                          <td style={{ fontSize: '0.85rem' }}>🚌 {sched.spec}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#10b981' }}>{sched.price}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="seats-indicator">{sched.seats}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              type="button" 
                              className={`btn-select-departure ${isSelected ? 'active' : ''}`}
                              onClick={() => handleSelectScheduleRow(sched)}
                            >
                              {isSelected ? '✓ Đang chọn' : 'Book Tour'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="tour-detailed-content">
            <h3>📋 Mô tả lịch trình & Điểm nhấn hành trình</h3>
            <p className="detailed-description-text">
              {localTour.description || 'Hiện tại lịch trình chi tiết cho tour du lịch này đang được cập nhật. Quý khách vui lòng liên hệ tư vấn để được hỗ trợ đầy đủ nhất...'}
            </p>
          </div>
        </div>

        {/* Right Column: Booking Box Sidebar */}
        <aside className="tour-booking-sidebar-card">
          <h3 className="sidebar-booking-title">🛒 Đặt Tour Nhanh</h3>
          <p className="sidebar-booking-sub">Nhập thông tin của bạn bên dưới để đăng ký giữ chỗ trực tuyến.</p>

          {errorMsg && <div className="auth-alert error">{errorMsg}</div>}

          <form onSubmit={handleAddToCart} className="dashboard-form">
            <div className="form-row">
              <div className="form-group half">
                <label>Ngày khởi hành *</label>
                {isStructured ? (
                  <select 
                    value={departureDate}
                    onChange={e => {
                      setDepartureDate(e.target.value);
                      const matched = structuredDepartures.find(s => s.date === e.target.value);
                      if (matched) setSelectedPrice(matched.price);
                    }}
                    required
                  >
                    {structuredDepartures.map((s, idx) => (
                      <option key={idx} value={s.date}>{s.date} ({s.price})</option>
                    ))}
                  </select>
                ) : parsedFallbackDates.length > 0 ? (
                  <select 
                    value={departureDate}
                    onChange={e => setDepartureDate(e.target.value)}
                    required
                  >
                    {parsedFallbackDates.map((date, idx) => (
                      <option key={idx} value={date}>{date}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="date" 
                    value={departureDate}
                    onChange={e => setDepartureDate(e.target.value)}
                    required
                  />
                )}
              </div>

              <div className="form-group half">
                <label>Số lượng khách *</label>
                <input 
                  type="number" 
                  min={1} 
                  max={50}
                  value={numberOfGuests}
                  onChange={e => setNumberOfGuests(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Ghi chú / Yêu cầu đặc biệt</label>
              <textarea 
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ví dụ: phòng gia đình, đón sân bay..."
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

            <div className="booking-price-preview" style={{ margin: '1rem 0', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>Giá tiền ước tính:</span>
                <span>{localTour.price === 0 ? 'Liên hệ' : (selectedPrice ? selectedPrice : formatPrice(localTour.price)) + ` \u00d7 ${numberOfGuests}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', marginTop: '0.25rem', color: '#10b981' }}>
                <span>Tổng chi phí đặt tour:</span>
                <span>
                  {localTour.price === 0
                    ? 'Liên hệ'
                    : selectedPrice
                      ? (Number(selectedPrice.replace(/[^0-9]/g, '')) * numberOfGuests).toLocaleString('vi-VN') + ' đ'
                      : (localTour.price * numberOfGuests).toLocaleString('vi-VN') + ' đ'
                  }
                </span>
              </div>
            </div>

            <button 
              type="submit" 
              className={`btn-dashboard-save ${isContactOnly ? 'btn-contact-only' : 'btn-security'}`} 
              style={{ 
                width: '100%', 
                marginTop: '0.5rem',
                background: isContactOnly ? 'linear-gradient(135deg, #f59e0b, #d97706)' : undefined 
              }}
            >
              {isContactOnly ? '📞 Liên hệ để đặt Tour' : '🛒 Thêm Vào Giỏ Hàng'}
            </button>
          </form>
        </aside>
      </div>

      {/* Checkout & Payment Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        booking={createdBooking}
        tour={localTour}
        onClose={() => {
          setShowCheckoutModal(false);
          setCreatedBooking(null);
        }}
      />

      {/* Contact Advice Modal */}
      {showContactModal && createPortal(
        <div className="auth-overlay" onClick={() => setShowContactModal(false)}>
          <div className="auth-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', padding: '2rem', textAlign: 'center' }}>
            <button className="auth-close" onClick={() => setShowContactModal(false)}>&times;</button>
            <span style={{ fontSize: '3rem' }}>📞</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '1rem 0 0.5rem 0', color: 'var(--primary)' }}>
              Liên Hệ Để Đặt Tour
            </h3>
            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Tour <strong>{localTour.title}</strong> vào thời điểm quý khách chọn cần được sắp xếp lịch trình và xác nhận dịch vụ trực tiếp.
            </p>
            
            <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1.5rem', textAlign: 'left' }}>
              <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📞</span> <strong>Hotline:</strong> <span style={{ color: 'var(--accent)', fontWeight: 700 }}>1900 1177</span>
              </div>
              <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>☎️</span> <strong>Điện thoại:</strong> <span>028 73056789</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>✉️</span> <strong>Email:</strong> <a href="mailto:22130245@st.hcmuaf.edu.vn" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>22130245@st.hcmuaf.edu.vn</a>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                className="btn-dashboard-save btn-security" 
                onClick={() => {
                  setShowContactModal(false);
                  navigate(`/gop-y?title=${encodeURIComponent('Yêu cầu tư vấn đặt Tour')}&content=${encodeURIComponent(`Tôi muốn đăng ký đặt tour: ${localTour.title}.\nHọ tên: ${fullName}\nSố điện thoại: ${phone}\nEmail: ${email}\nYêu cầu khác: ${notes}`)}`);
                }}
                style={{ width: '100%', margin: 0 }}
              >
                ✉️ Gửi yêu cầu tư vấn trực tuyến
              </button>
              <button 
                className="btn-reset" 
                onClick={() => setShowContactModal(false)}
                style={{ width: '100%', margin: 0 }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add To Cart Success Dialog */}
      {showSuccessDialog && createPortal(
        <div className="cart-success-dialog-overlay" onClick={() => setShowSuccessDialog(false)}>
          <div className="cart-success-dialog" onClick={e => e.stopPropagation()}>
            <span className="cart-success-icon">🎉</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', color: '#10b981' }}>
              Thêm Vào Giỏ Hàng Thành Công!
            </h3>
            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Tour <strong>{localTour?.title}</strong> đã được thêm vào giỏ hàng của bạn.
            </p>

            <div className="cart-success-btns">
              <button 
                className="btn-reset" 
                onClick={() => setShowSuccessDialog(false)}
                style={{ flex: 1, margin: 0, padding: '0.65rem 1rem' }}
              >
                Tiếp tục xem tour
              </button>
              <button 
                className="btn-dashboard-save btn-security" 
                onClick={() => {
                  setShowSuccessDialog(false);
                  navigate('/cart');
                }}
                style={{ flex: 1, margin: 0, padding: '0.65rem 1rem' }}
              >
                Tới giỏ hàng ➔
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

