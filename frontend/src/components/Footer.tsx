import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectLocation = (loc: string) => {
    navigate(`/?keyword=${encodeURIComponent(loc)}`);
  };

  const domesticLocations = [
    "Phú Quốc", "Đà Lạt", "Nha Trang", "Sapa", "Miền Tây", "Côn Đảo",
    "Đà Nẵng", "Hạ Long", "Quy Nhơn", "Phan Thiết", "Huế", "Nam Du"
  ];

  const asiaLocations = [
    "Nhật Bản", "Hàn Quốc", "Trung Quốc", "Đài Loan", "Singapore", "Thái Lan",
    "Malaysia", "Dubai", "Indonesia", "Tây Tạng", "Phượng Hoàng Cổ Trấn", "Thế Giới"
  ];

  const westernLocations = [
    "Châu Âu", "Đức", "Pháp", "Ý", "Thụy Sĩ", "Anh", "Mỹ", "Úc", "Thổ Nhĩ Kỳ",
    "Bỉ", "Hà Lan", "Nga"
  ];

  return (
    <footer className="footer">
      <div className="footer-top">
        {/* Section 1: Destinations categories listing */}
        <div className="footer-dest-listing-row">
          <div className="footer-dest-col">
            <h4>📍 Trong nước</h4>
            <div className="footer-dest-links-grid">
              {domesticLocations.map(loc => (
                <span 
                  key={loc} 
                  className="footer-dest-link" 
                  onClick={() => handleSelectLocation(loc)}
                  style={{ cursor: 'pointer' }}
                >
                  Du lịch {loc}
                </span>
              ))}
            </div>
          </div>

          <div className="footer-dest-col">
            <h4>✈️ Châu Á</h4>
            <div className="footer-dest-links-grid">
              {asiaLocations.map(loc => (
                <span 
                  key={loc} 
                  className="footer-dest-link" 
                  onClick={() => handleSelectLocation(loc)}
                  style={{ cursor: 'pointer' }}
                >
                  {loc === 'Phượng Hoàng Cổ Trấn' ? loc : `Du lịch ${loc}`}
                </span>
              ))}
            </div>
          </div>

          <div className="footer-dest-col">
            <h4>🌍 Châu Âu - Úc - Mỹ</h4>
            <div className="footer-dest-links-grid">
              {westernLocations.map(loc => (
                <span 
                  key={loc} 
                  className="footer-dest-link" 
                  onClick={() => handleSelectLocation(loc)}
                  style={{ cursor: 'pointer' }}
                >
                  Du lịch {loc}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Info details row */}
        <div className="footer-info-details-row">
          <div className="footer-info-col" style={{ gridColumn: 'span 1' }}>
            <h4>Liên hệ</h4>
            <p className="footer-company-name">CÔNG TY CỔ PHẦN TRUYỀN THÔNG BINTRAVEL</p>
            <ul className="footer-address-list">
              <li>
                <strong>Trụ sở chính:</strong> 239A Hoàng Văn Thụ, P.8, Q.Phú Nhuận, TP. Hồ Chí Minh.
              </li>
              <li>
                <strong>Văn phòng:</strong> 217 Bis Nguyễn Thị Minh Khai, P.Nguyễn Cư Trinh, Quận 1, TP. Hồ Chí Minh.
              </li>
              <li>
                <strong>Chi nhánh Hà Nội:</strong> Tầng 3, số 243 Xã Đàn, P.Nam Đồng, Q.Đống Đa, Hà Nội.
              </li>
              <li>
                <strong>Điện thoại:</strong> 028 73056789 | <strong>Hotline:</strong> 1900 1177
              </li>
              <li>
                <strong>Email:</strong> 22130245@st.hcmuaf.edu.vn
              </li>
            </ul>
          </div>

          <div className="footer-info-col">
            <h4>Góc khách hàng</h4>
            <ul className="footer-links-list">
              <li><span style={{ cursor: 'pointer' }}>Chính sách đặt tour</span></li>
              <li><span style={{ cursor: 'pointer' }}>Chính sách bảo mật</span></li>
              <li><span style={{ cursor: 'pointer' }}>Ý kiến khách hàng</span></li>
              <li><Link to="/gop-y" style={{ cursor: 'pointer' }}>Đóng góp ý kiến</Link></li>
              <li><span style={{ cursor: 'pointer' }}>Tin tức & Sự kiện</span></li>
            </ul>
          </div>

          <div className="footer-info-col">
            <h4>Chứng nhận</h4>
            <div className="footer-trust-certs">
              <img
                src="https://images.dmca.com/Badges/dmca_protected_sspry_250b.png?ID=287b9264-b0a7-47b2-84a1-05ea1221b6d0"
                alt="DMCA Protected"
                className="trust-badge-img"
              />
              <img
                src="https://toursg.vn/images/bo-cong-thuong.png"
                alt="Đã thông báo Bộ Công Thương"
                className="trust-badge-img"
                style={{ width: '130px', background: '#fff', padding: '5px', border: '1px solid #ddd' }}
              />
            </div>
          </div>

          <div className="footer-info-col">
            <h4>Khuyến mãi</h4>
            <div className="footer-subscribe-wrapper">
              <p className="footer-subscribe-desc">
                Đăng ký email để có cơ hội nhận mã giảm giá lên tới 50% cho các chuyến đi tiếp theo của quý khách.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); alert('Cảm ơn bạn đã đăng ký nhận bản tin!'); }} className="footer-subscribe-form">
                <input
                  type="email"
                  className="footer-subscribe-input"
                  placeholder="Nhập email của bạn..."
                  required
                />
                <button type="submit" className="footer-subscribe-btn">
                  ✉️
                </button>
              </form>

              <h4 className="footer-social-header">Kết nối với chúng tôi</h4>
              <div className="footer-social-icons">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-icon-btn" title="Facebook">
                  f
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="social-icon-btn youtube" title="Youtube">
                  ▶
                </a>
                <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="social-icon-btn maps" title="Google Maps">
                  📍
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom payments & apps bar */}
      <div className="footer-bottom-bar">
        <div className="footer-bottom-container">
          <div className="bottom-bar-left">
            <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>Chấp nhận thanh toán:</span>
            <div className="payment-methods-logos">
              <img src="https://dulichviet.com.vn/images/onepay.png" alt="OnePay" className="payment-logo" style={{ height: '20px', background: '#fff', padding: '2px', border: '1px solid #ddd' }} />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/1200px-Visa_Inc._logo.svg.png" alt="Visa" className="payment-logo" style={{ height: '16px' }} />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mastercard_2019_logo.svg/1200px-Mastercard_2019_logo.svg.png" alt="MasterCard" className="payment-logo" style={{ height: '16px' }} />
            </div>
          </div>

          <div className="bottom-bar-right">
            <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>Ứng dụng di động:</span>
            <div className="app-store-badges">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/1200px-Google_Play_Store_badge_EN.svg.png"
                alt="Google Play"
                className="app-badge-img"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Download_on_the_App_Store_Badge.svg/1200px-Download_on_the_App_Store_Badge.svg.png"
                alt="App Store"
                className="app-badge-img"
              />
            </div>
          </div>
        </div>

        <div className="footer-copyright">
          © 2026 BINTRAVEL. Bản quyền đã được bảo hộ.
        </div>
      </div>
    </footer>
  );
};
