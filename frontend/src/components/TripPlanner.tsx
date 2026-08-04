import React, { useEffect, useState } from 'react';

interface ItineraryDay {
  id?: number;
  dayNumber: number;
  activities: string;
}

interface TripPlan {
  id?: number;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  itineraryDays: ItineraryDay[];
}

interface TripExpense {
  id?: number;
  tripPlanId: number;
  title: string;
  amount: number;
  category: string;
  date: string;
}

interface TripPlannerProps {
  token: string;
}

export const TripPlanner: React.FC<TripPlannerProps> = ({ token }) => {
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<TripPlan | null>(null);
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);

  // Expense form states
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseCategory, setExpenseCategory] = useState('Ăn uống');
  const [expenseDate, setExpenseDate] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  const handleAiGenerateItinerary = async () => {
    if (!destination.trim()) {
      alert('Vui lòng nhập điểm đến trước khi yêu cầu AI gợi ý!');
      return;
    }
    if (!startDate || !endDate) {
      alert('Vui lòng chọn ngày bắt đầu và kết thúc để AI xác định thời lượng chuyến đi!');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      alert('Ngày kết thúc không được nhỏ hơn ngày bắt đầu');
      return;
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    setLoadingAi(true);
    try {
      const res = await fetch('http://localhost:5000/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: destination.trim(), days: daysCount }),
      });
      const data = await res.json();
      if (res.ok && data.itinerary) {
        const newDays: ItineraryDay[] = [];
        for (let i = 1; i <= daysCount; i++) {
          newDays.push({
            dayNumber: i,
            activities: data.itinerary[i - 1] || `Tự do khám phá tại ${destination}`,
          });
        }
        setItineraryDays(newDays);
      } else {
        alert(data.error || 'Không thể tạo lịch trình gợi ý từ máy chủ AI');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ AI. Hãy đảm bảo python server (port 5000) đã được khởi chạy.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Fetch all trips on mount
  useEffect(() => {
    fetchTrips();
  }, []);

  // Update itinerary days array based on dates
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // Generate or retain existing activities
        const newDays: ItineraryDay[] = [];
        for (let i = 1; i <= daysCount; i++) {
          const existing = itineraryDays.find(d => d.dayNumber === i);
          newDays.push({
            dayNumber: i,
            activities: existing ? existing.activities : '',
          });
        }
        setItineraryDays(newDays);
      }
    }
  }, [startDate, endDate]);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/trips', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTrips(data);
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrip = async (trip: TripPlan) => {
    setLoading(true);
    setSelectedTrip(trip);
    setExpenseDate(trip.startDate); // default expense date to trip start date
    try {
      const res = await fetch(`http://localhost:8080/api/trips/${trip.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        // Updated details with itineraries and expenses
        setSelectedTrip(data.tripPlan);
        setExpenses(data.expenses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setTitle('');
    setDestination('');
    setStartDate('');
    setEndDate('');
    setItineraryDays([]);
    setErrorMsg('');
    setSuccessMsg('');
    setShowForm(true);
    setSelectedTrip(null);
  };

  const handleSaveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title || !destination || !startDate || !endDate) {
      setErrorMsg('Vui lòng nhập đầy đủ các trường thông tin bắt đầu chuyến đi');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setErrorMsg('Ngày kết thúc không được nhỏ hơn ngày bắt đầu');
      return;
    }

    const payload = {
      title,
      destination,
      startDate,
      endDate,
      itineraryDays,
    };

    try {
      const res = await fetch('http://localhost:8080/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Tạo kế hoạch chuyến đi thành công!');
        setShowForm(false);
        fetchTrips();
        handleSelectTrip(data);
      } else {
        setErrorMsg(data.message || 'Lỗi khi lưu chuyến đi');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ');
    }
  };

  const handleDeleteTrip = async (tripId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn XÓA chuyến đi này cùng tất cả lịch trình và chi phí đi kèm?')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/trips/${tripId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setSelectedTrip(null);
        fetchTrips();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleItineraryActivityChange = (dayNum: number, value: string) => {
    setItineraryDays(prev =>
      prev.map(d => (d.dayNumber === dayNum ? { ...d, activities: value } : d))
    );
  };

  // Expenses management
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip || !selectedTrip.id || !expenseTitle || !expenseAmount) return;

    const payload = {
      title: expenseTitle,
      amount: Number(expenseAmount),
      category: expenseCategory,
      date: expenseDate || selectedTrip.startDate,
    };

    try {
      const res = await fetch(`http://localhost:8080/api/trips/${selectedTrip.id}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setExpenses(prev => [...prev, data]);
        // clear inputs
        setExpenseTitle('');
        setExpenseAmount('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/trips/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((acc, curr) => acc + curr.amount, 0);
  };

  return (
    <div className="trip-planner-container">
      {/* Sidebar List and Header */}
      <div className="planner-layout">
        
        {/* Left Side: Trip list */}
        <aside className="planner-sidebar">
          <div className="sidebar-header-flex">
            <h4>Chuyến đi của tôi</h4>
            <button className="btn-add-trip" onClick={handleOpenCreate}>
              ➕ Lập lịch mới
            </button>
          </div>

          {loading && trips.length === 0 ? (
            <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Đang tải lịch trình...</div>
          ) : trips.length === 0 ? (
            <div className="empty-trips">
              <p>Bạn chưa lên kế hoạch chuyến đi nào.</p>
              <button className="btn-dashboard-save" onClick={handleOpenCreate} style={{ fontSize: '0.85rem' }}>
                Lập lịch ngay
              </button>
            </div>
          ) : (
            <div className="trips-list">
              {trips.map(trip => (
                <div 
                  key={trip.id} 
                  className={`trip-item-card ${selectedTrip?.id === trip.id ? 'active' : ''}`}
                  onClick={() => handleSelectTrip(trip)}
                >
                  <div className="trip-item-title">{trip.title}</div>
                  <div className="trip-item-dest">📍 {trip.destination}</div>
                  <div className="trip-item-dates">
                    📅 {new Date(trip.startDate).toLocaleDateString('vi-VN')} - {new Date(trip.endDate).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Right Side: Details View or Create Form */}
        <main className="planner-detail-area">
          {errorMsg && <div className="auth-alert error">{errorMsg}</div>}
          {successMsg && <div className="auth-alert success">{successMsg}</div>}

          {/* Form: Create Trip Plan */}
          {showForm && (
            <div className="planner-form-card">
              <h3 className="card-heading">🗺️ Lập kế hoạch chuyến đi mới</h3>
              <form onSubmit={handleSaveTrip} className="dashboard-form">
                <div className="form-group">
                  <label>Tên kế hoạch chuyến đi *</label>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: Du hí Phú Quốc 3 Ngày, Phượt Hà Giang..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Điểm đến *</label>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: Phú Quốc, Sapa, Đà Lạt..."
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label>Ngày bắt đầu *</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group half">
                    <label>Ngày kết thúc *</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Itinerary days textareas generated dynamically */}
                {itineraryDays.length > 0 && (
                  <div className="dynamic-itinerary-inputs">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0 0.5rem 0' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary)' }}>
                        ✍️ Biên tập lịch trình chi tiết
                      </h4>
                      <button
                        type="button"
                        onClick={handleAiGenerateItinerary}
                        disabled={loadingAi}
                        style={{
                          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                          color: '#fff',
                          border: 'none',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        {loadingAi ? '⏳ Đang tạo...' : '🪄 Gợi ý lịch trình AI'}
                      </button>
                    </div>
                    {itineraryDays.map(day => (
                      <div key={day.dayNumber} className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Ngày {day.dayNumber}: Lịch trình chi tiết</label>
                        <textarea
                          placeholder={`Nhập các hoạt động chính cho Ngày thứ ${day.dayNumber}...`}
                          value={day.activities}
                          onChange={e => handleItineraryActivityChange(day.dayNumber, e.target.value)}
                          rows={2}
                          style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-main)',
                            borderRadius: '4px',
                            padding: '0.5rem',
                            width: '100%',
                            fontFamily: 'var(--font-primary)',
                            resize: 'none',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-reset" onClick={() => setShowForm(false)} style={{ margin: 0 }}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn-dashboard-save" style={{ margin: 0, width: 'auto' }}>
                    Lưu lịch trình
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Details view of selected trip */}
          {selectedTrip && !showForm && (
            <div className="trip-details-view">
              <div className="trip-details-header">
                <div>
                  <h3>{selectedTrip.title}</h3>
                  <div className="trip-info-sub">
                    <span>📍 Điểm đến: <strong>{selectedTrip.destination}</strong></span>
                    <span style={{ marginLeft: '1rem' }}>
                      📅 Thời gian: {new Date(selectedTrip.startDate).toLocaleDateString('vi-VN')} - {new Date(selectedTrip.endDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
                <button className="btn-action-delete" onClick={() => handleDeleteTrip(selectedTrip.id!)}>
                  🗑️ Xóa chuyến đi
                </button>
              </div>

              {/* Main Content splits into Itinerary and Expenses */}
              <div className="trip-details-grid">
                
                {/* 1. ITINERARY VIEW */}
                <div className="trip-itinerary-section">
                  <h4 className="detail-section-heading">🗓️ Chi tiết lịch trình hoạt động</h4>
                  {selectedTrip.itineraryDays && selectedTrip.itineraryDays.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', padding: '1rem' }}>Chưa thiết lập lịch trình chi tiết.</div>
                  ) : (
                    <div className="itinerary-timeline">
                      {selectedTrip.itineraryDays?.sort((a, b) => a.dayNumber - b.dayNumber).map(day => (
                        <div key={day.id || day.dayNumber} className="timeline-day-card">
                          <div className="timeline-day-num">Ngày {day.dayNumber}</div>
                          <div className="timeline-day-activities">
                            {day.activities ? (
                              day.activities.split('\n').map((act, index) => (
                                <p key={index} style={{ marginBottom: '0.25rem' }}>• {act}</p>
                              ))
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Trống. Chưa có hoạt động nào được thêm.</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. EXPENSES TRACKER */}
                <div className="trip-expenses-section">
                  <h4 className="detail-section-heading">💳 Quản lý chi phí chi tiêu</h4>
                  
                  {/* Expense Input form */}
                  <form onSubmit={handleAddExpense} className="expense-quick-form">
                    <input 
                      type="text" 
                      placeholder="Mục chi tiêu (ví dụ: Vé tham quan)"
                      value={expenseTitle}
                      onChange={e => setExpenseTitle(e.target.value)}
                      required
                    />
                    <input 
                      type="number" 
                      placeholder="Số tiền (đ)"
                      value={expenseAmount}
                      onChange={e => setExpenseAmount(e.target.value ? Number(e.target.value) : '')}
                      required
                    />
                    <select 
                      value={expenseCategory}
                      onChange={e => setExpenseCategory(e.target.value)}
                    >
                      <option value="Ăn uống">🍲 Ăn uống</option>
                      <option value="Di chuyển">🚗 Di chuyển</option>
                      <option value="Lưu trú">🏨 Lưu trú</option>
                      <option value="Vui chơi">🎡 Vui chơi</option>
                      <option value="Khác">🛍️ Khác</option>
                    </select>
                    <button type="submit" className="btn-add-expense">Thêm</button>
                  </form>

                  {/* Expense List */}
                  <div className="expenses-list-wrapper">
                    <table className="expense-table">
                      <thead>
                        <tr>
                          <th>Mục chi tiêu</th>
                          <th>Phân loại</th>
                          <th style={{ textAlign: 'right' }}>Số tiền</th>
                          <th style={{ width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                              Chưa có khoản chi tiêu nào được thêm.
                            </td>
                          </tr>
                        ) : (
                          expenses.map(exp => (
                            <tr key={exp.id}>
                              <td>{exp.title}</td>
                              <td>
                                <span className="expense-cat-badge">{exp.category}</span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent)' }}>
                                {exp.amount.toLocaleString('vi-VN')} đ
                              </td>
                              <td>
                                <button className="btn-del-expense" onClick={() => handleDeleteExpense(exp.id!)}>
                                  &times;
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary cost */}
                  <div className="expense-summary-footer">
                    <span>Tổng cộng đã chi:</span>
                    <strong style={{ fontSize: '1.2rem', color: '#10b981' }}>
                      {calculateTotalExpenses().toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                </div>

              </div>
            </div>
          )}

          {!selectedTrip && !showForm && (
            <div className="planner-placeholder">
              <div className="placeholder-icon">📅</div>
              <h3>Chọn chuyến đi của bạn</h3>
              <p>Chọn một chuyến đi có sẵn ở thanh bên trái hoặc tạo một chuyến đi mới để biên tập lịch trình và chi tiêu chi tiết!</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
