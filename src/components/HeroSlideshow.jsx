import { useState, useEffect } from 'react';
import './HeroSlideshow.css';

const HeroSlideshow = ({ slides }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(c => (c + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prev = () => setCurrent(c => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent(c => (c + 1) % slides.length);

  return (
    <div className="hero-slideshow">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`hero-slide ${i === current ? 'active' : ''}`}
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          <div className="hero-overlay" />
          <div className="hero-text">
            <span className="hero-eyebrow">{slide.eyebrow || 'Zelp Zimbabwe'}</span>
            <h1 className="hero-heading">{slide.title}</h1>
            <p className="hero-sub">{slide.subtitle}</p>
            {slide.cta && (
              <a href={slide.ctaLink || '#'} className="hero-cta-btn">{slide.cta}</a>
            )}
          </div>
        </div>
      ))}

      {/* Flag stripe */}
      <div className="flag-stripe" />

      {/* Arrows */}
      <button className="hero-arrow left" onClick={prev} aria-label="Previous">&#8592;</button>
      <button className="hero-arrow right" onClick={next} aria-label="Next">&#8594;</button>

      {/* Dots */}
      <div className="hero-dots">
        {slides.map((_, i) => (
          <button key={i} className={`hero-dot ${i === current ? 'active' : ''}`} onClick={() => setCurrent(i)} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>
    </div>
  );
};

export default HeroSlideshow;
