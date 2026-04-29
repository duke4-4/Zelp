import HeroSlideshow from '../components/HeroSlideshow';
import './InfoPage.css';

const slides = [
  { image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&w=1600&q=80', eyebrow: 'Advertise', title: 'Drive More Sales', subtitle: 'Put your business in front of customers looking to buy.' },
];

const Advertise = () => (
  <div className="info-page">
    <HeroSlideshow slides={slides} />
    <div className="container info-container">
      <h2>Zelp Ads</h2>
      <p>Targeted local advertising that works. Show up when people in your area are actively searching for what you offer.</p>
      <div className="values-grid">
        <div className="value-card">
          <span className="value-icon">🎯</span>
          <h3>Hyper-Local Targeting</h3>
          <p>Reach customers in specific cities or neighborhoods like Borrowdale, Avondale, or CBD.</p>
        </div>
        <div className="value-card">
          <span className="value-icon">📈</span>
          <h3>Track Performance</h3>
          <p>See exactly how many people viewed your ad, clicked on it, and contacted your business.</p>
        </div>
      </div>
    </div>
  </div>
);

export default Advertise;
