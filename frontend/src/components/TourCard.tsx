import React from 'react';
import { Link } from 'react-router-dom';

export interface Tour {
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
}

interface TourCardProps {
  tour: Tour;
  isFavorite?: boolean;
  onToggleFavorite?: (tourId: number) => void;
}

export const TourCard: React.FC<TourCardProps> = ({ tour, isFavorite = false, onToggleFavorite }) => {
  const formatPrice = (price: number) => {
    if (price === 0) return 'Liên hệ';
    return price.toLocaleString('vi-VN') + ' đ';
  };

  const isDomestic = tour.category === 'Trong nước';

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(tour.id);
    }
  };

  return (
    <Link to={`/tour/${tour.id}`} className="tour-card" style={{ display: 'flex', textDecoration: 'none', color: 'inherit' }}>
      <div className="card-image-wrapper">
        <img 
          src={tour.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=60'} 
          alt={tour.title} 
          className="card-image"
          loading="lazy"
        />
        <div className={`card-badge ${isDomestic ? 'domestic' : 'intl'}`}>
          {isDomestic ? '📍 Trong nước' : '✈️ Nước ngoài'}
        </div>
        <button
          type="button"
          onClick={handleHeartClick}
          className="card-favorite-btn"
          title={isFavorite ? "Xóa khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>
      <div className="card-content">
        <div className="card-location">{tour.location}</div>
        <h3 className="card-title" title={tour.title}>{tour.title}</h3>
        <div className="card-footer">
          <div>
            <div className="card-price-label">Giá trọn gói</div>
            <div className="card-price">{formatPrice(tour.price)}</div>
          </div>
          <div className="card-duration">
            ⏱️ {tour.duration}
          </div>
        </div>
      </div>
    </Link>
  );
};

