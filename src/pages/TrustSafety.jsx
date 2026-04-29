import HeroSlideshow from '../components/HeroSlideshow';
import './InfoPage.css';

const slides = [
  { image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=80', eyebrow: 'Trust & Safety', title: 'Keeping Zelp Authentic', subtitle: 'Our commitment to real reviews and a safe community.' },
];

const TrustSafety = () => (
  <div className="info-page">
    <HeroSlideshow slides={slides} />
    <div className="container info-container">
      <h2>How We Protect the Community</h2>
      <p>Trust is the foundation of Zelp. We employ advanced algorithms and a dedicated moderation team based right here in Zimbabwe to ensure that every review you read is genuine.</p>
      
      <div className="trust-grid">
        <div className="trust-card">
          <div className="trust-icon">🛡️</div>
          <h3>Recommendation Software</h3>
          <p>Our software evaluates every review based on quality, reliability, and user activity.</p>
        </div>
        <div className="trust-card">
          <div className="trust-icon">👥</div>
          <h3>Real People</h3>
          <p>Our Harare-based moderation team investigates suspicious activity and flagged content.</p>
        </div>
        <div className="trust-card">
          <div className="trust-icon">🚫</div>
          <h3>Zero Tolerance</h3>
          <p>We do not allow businesses to pay to remove or alter their reviews. Honesty is our policy.</p>
        </div>
      </div>
    </div>
  </div>
);

export default TrustSafety;
