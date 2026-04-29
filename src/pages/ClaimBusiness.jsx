import HeroSlideshow from '../components/HeroSlideshow';
import './InfoPage.css';

const slides = [
  { image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&w=1600&q=80', eyebrow: 'Zelp for Business', title: 'Claim Your Business Page', subtitle: 'Take control of your online presence and reach more local customers.', cta: 'Claim Now', ctaLink: '/login' },
];

const ClaimBusiness = () => (
  <div className="info-page">
    <HeroSlideshow slides={slides} />
    <div className="container info-container">
      <h2>Why Claim Your Page?</h2>
      <p>Millions of people use Zelp every month to decide where to spend their money. When you claim your free Business Page, you can:</p>
      <div className="values-grid">
        <div className="value-card">
          <span className="value-icon">📸</span>
          <h3>Update Information & Photos</h3>
          <p>Add your phone number, website, hours of operation, and high-quality photos of your products or venue.</p>
        </div>
        <div className="value-card">
          <span className="value-icon">💬</span>
          <h3>Respond to Reviews</h3>
          <p>Engage with your customers by replying to their feedback directly. Build loyalty and trust.</p>
        </div>
      </div>
      <div className="page-cta">
        <h2>Ready to grow your business?</h2>
        <p>Join thousands of Zimbabwean businesses already thriving on Zelp.</p>
        <a href="/login" className="btn">Get Started for Free</a>
      </div>
    </div>
  </div>
);

export default ClaimBusiness;
