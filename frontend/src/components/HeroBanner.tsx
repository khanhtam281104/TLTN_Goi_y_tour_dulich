import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Tour } from './TourCard';

interface HeroBannerProps {
  onSelectDestination?: (keyword: string) => void;
  featuredTours?: Tour[];
}

export const HeroBanner: React.FC<HeroBannerProps> = () => {
  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = useState(0);

  const defaultSlides = [
    {
      id: 4,
      imageUrl: "https://dulichviet.com.vn/images/bandidau/banner/bia_web_he_2506.png?v=1"
    },
    {
      id: 44,
      imageUrl: "https://dulichviet.com.vn/images/bandidau/banner/banner_phuongbac_1607.jpg?v=1"
    },
    {
      id: 30,
      imageUrl: "https://dulichviet.com.vn/images/bandidau/banner/Banner-GIT.png?v=1"
    },
    {
      id: 2,
      imageUrl: "https://dulichviet.com.vn/images/bandidau/banner/du-lich-chau-uc.webp?v=1"
    }
  ];

  // Only slide through the configured wide banner images
  const activeSlides = defaultSlides;

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx(prev => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx(prev => (prev + 1) % activeSlides.length);
  };

  const handleBannerClick = (tourId: number) => {
    navigate(`/tour/${tourId}`);
  };

  return (
    <section className="hero-banner-container page-fade" style={{ margin: 0, padding: 0 }}>
      {/* 100% Width Slide Container */}
      <div className="hero-banner-left" style={{ position: 'relative', overflow: 'hidden', padding: 0, width: '100%', height: '420px', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}>
        {activeSlides.map((slide, idx) => {
          const isActive = idx === currentIdx;
          return (
            <div
              key={idx}
              className={`hero-slide-item ${isActive ? 'active' : ''}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: isActive ? 1 : 0,
                visibility: isActive ? 'visible' : 'hidden',
                transition: 'opacity 0.8s ease-in-out, visibility 0.8s ease-in-out',
                backgroundImage: `url(${slide.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                cursor: 'pointer',
                zIndex: isActive ? 1 : 0
              }}
              onClick={() => handleBannerClick(slide.id)}
            />
          );
        })}

        {/* Carousel Navigation Buttons */}
        {activeSlides.length > 1 && (
          <>
            <button
              className="carousel-btn prev-btn"
              onClick={handlePrev}
              style={{
                position: 'absolute',
                left: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(15, 23, 42, 0.45)',
                border: 'none',
                color: '#ffffff',
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                fontSize: '2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                transition: 'all 0.2s',
                backdropFilter: 'blur(4px)'
              }}
              title="Hình trước"
            >
              ‹
            </button>
            <button
              className="carousel-btn next-btn"
              onClick={handleNext}
              style={{
                position: 'absolute',
                right: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(15, 23, 42, 0.45)',
                border: 'none',
                color: '#ffffff',
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                fontSize: '2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                transition: 'all 0.2s',
                backdropFilter: 'blur(4px)'
              }}
              title="Hình tiếp theo"
            >
              ›
            </button>

            {/* Slide Dots Indicators */}
            <div
              className="carousel-dots"
              style={{
                position: 'absolute',
                bottom: '1.25rem',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '0.6rem',
                zIndex: 2
              }}
            >
              {activeSlides.map((_, idx) => (
                <span
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIdx(idx);
                  }}
                  style={{
                    width: idx === currentIdx ? '28px' : '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: idx === currentIdx ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
