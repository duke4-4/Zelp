import HeroSlideshow from '../components/HeroSlideshow';
import './InfoPage.css';

const slides = [
  { image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80', eyebrow: 'Restaurant Owners', title: 'Fill More Tables', subtitle: 'Turn Zelp views into reservations and orders.' },
];

const RestaurantOwners = () => (
  <div className="info-page">
    <HeroSlideshow slides={slides} />
    <div className="container info-container">
      <h2>Built for the Hospitality Industry</h2>
      <p>Whether you run a fine dining establishment in Borrowdale or a busy sadza joint in the CBD, Zelp provides the tools to attract hungry diners.</p>
      <div className="values-grid">
        <div className="value-card">
          <span className="value-icon">🍽️</span>
          <h3>Menu Integration</h3>
          <p>Upload your latest menu so customers know exactly what you serve before they arrive.</p>
        </div>
        <div className="value-card">
          <span className="value-icon">📅</span>
          <h3>Reservations</h3>
          <p>Allow customers to book a table directly from your Zelp Business Page.</p>
        </div>
      </div>
    </div>
  </div>
);

export default RestaurantOwners;
