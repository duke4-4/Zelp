import HeroSlideshow from '../components/HeroSlideshow';
import './InfoPage.css';

const slides = [
  { image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1600&q=80', eyebrow: 'Cost Guides', title: 'Home Project Costs', subtitle: 'Know what to expect before you hire in Zimbabwe.' },
];

const CostGuides = () => (
  <div className="info-page">
    <HeroSlideshow slides={slides} />
    <div className="container info-container">
      <h2>Zelp Project Cost Guides</h2>
      <p>Planning a renovation or repair? We've aggregated data from thousands of completed projects across Zimbabwe to give you a clear idea of what things should cost.</p>
      
      <div className="guide-grid">
        {[
          { icon: '🚰', title: 'Plumbing Repair', desc: 'Average cost: $30 - $80 per callout' },
          { icon: '⚡', title: 'Electrical Work', desc: 'Average cost: $40 - $120 depending on scope' },
          { icon: '🧱', title: 'Bricklaying & Building', desc: 'Average cost: $15 - $25 per square meter' },
          { icon: '🎨', title: 'House Painting', desc: 'Average cost: $5 - $10 per square meter' },
        ].map(g => (
          <div key={g.title} className="guide-card">
            <span className="guide-icon">{g.icon}</span>
            <div>
              <h3>{g.title}</h3>
              <p>{g.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default CostGuides;
