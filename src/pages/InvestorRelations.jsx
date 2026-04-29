import HeroSlideshow from '../components/HeroSlideshow';
import './InfoPage.css';

const slides = [
  { image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80', eyebrow: 'Investor Relations', title: 'Investing in Zelp', subtitle: 'Financials, news, and resources for our investors.' },
];

const InvestorRelations = () => (
  <div className="info-page">
    <HeroSlideshow slides={slides} />
    <div className="container info-container">
      <h2>Financial Performance</h2>
      <p>Zelp is a privately held company committed to transparency and robust growth. Since our inception, we have seen exponential growth in active users and listed businesses across Zimbabwe.</p>
      
      <h2>Quarterly Highlights</h2>
      <div className="investor-grid">
        <div className="stat-card">
          <span className="stat-num">Q3</span>
          <span className="stat-label">2026 Revenue Up 45%</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">10K</span>
          <span className="stat-label">New Businesses Added</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">1.2M</span>
          <span className="stat-label">Total User Reviews</span>
        </div>
      </div>
    </div>
  </div>
);

export default InvestorRelations;
