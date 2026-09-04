'use client';

import { useState, useRef } from 'react';
import CaseStudyImage from './CaseStudyImage';

export default function GalleryCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideRef = useRef(null);

  if (!images || images.length === 0) return null;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  const handleDoubleClick = () => {
    if (slideRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        slideRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    }
  };

  const currentMedia = images[currentIndex];

  return (
    <div className="gallery-carousel">
      <div 
        className="gallery-slide" 
        ref={slideRef} 
        onDoubleClick={handleDoubleClick}
        title="Doble click para pantalla completa"
      >
        <CaseStudyImage url={currentMedia.url} alt={currentMedia.alt} />
        {images.length > 1 && (
          <div className="gal-count-floating">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
      
      {images.length > 1 && (
        <>
          <button onClick={prevSlide} className="btn-gal btn-gal-left" aria-label="Anterior">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button onClick={nextSlide} className="btn-gal btn-gal-right" aria-label="Siguiente">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
