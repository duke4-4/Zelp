import { Link } from 'react-router-dom';
import { Utensils, Wrench, Car, MoreHorizontal, Star } from 'lucide-react';
import HeroSlideshow from '../components/HeroSlideshow';
import './Home.css';

const homeSlides = [
  { image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80', eyebrow: 'Welcome to Zelp', title: 'Discover Local Favorites', subtitle: 'Find the best restaurants, home services, and more in Zimbabwe.' },
  { image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=80', eyebrow: 'Community Driven', title: 'Support Local Business', subtitle: 'Read honest reviews from real people in your neighborhood.' },
];

const Home = () => {
  return (
    <div className="home">
      <HeroSlideshow slides={homeSlides} />

      <section className="categories-section" style={{ padding: '40px 0', background: 'var(--primary-white)' }}>
        <div className="container">
          <div className="categories-grid">
            <Link to="/search?q=restaurants" className="category-card hover-lift">
              <Utensils size={32} color="var(--primary-green)" />
              <span style={{ marginTop: '8px', fontWeight: 'bold' }}>Restaurants</span>
            </Link>
            <Link to="/search?q=home-services" className="category-card hover-lift">
              <Wrench size={32} color="var(--primary-green)" />
              <span style={{ marginTop: '8px', fontWeight: 'bold' }}>Home Services</span>
            </Link>
            <Link to="/search?q=auto-services" className="category-card hover-lift">
              <Car size={32} color="var(--primary-green)" />
              <span style={{ marginTop: '8px', fontWeight: 'bold' }}>Auto Services</span>
            </Link>
            <Link to="/search?q=more" className="category-card hover-lift">
              <MoreHorizontal size={32} color="var(--primary-green)" />
              <span style={{ marginTop: '8px', fontWeight: 'bold' }}>More</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="recent-activity">
        <div className="container">
          <h2 className="section-title">Recent Activity in Harare</h2>
          <div className="activity-grid">
            {[1, 2, 3].map((item) => (
              <div key={item} className="activity-card hover-lift">
                <div className="activity-header">
                  <div className="avatar"></div>
                  <div className="user-info">
                    <strong>Tendai M.</strong>
                    <span>Wrote a review</span>
                  </div>
                </div>
                <div className="activity-body">
                  <img src={`https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=400&q=80`} alt="Restaurant" className="activity-image" />
                  <div className="activity-content">
                    <Link to="/biz/1" className="biz-name">Sadza & Co.</Link>
                    <div className="stars">
                      <Star size={16} className="star-filled" />
                      <Star size={16} className="star-filled" />
                      <Star size={16} className="star-filled" />
                      <Star size={16} className="star-filled" />
                      <Star size={16} className="star-filled" />
                    </div>
                    <p className="review-snippet">"The best sadza and nyama in town! Highly recommend coming here for lunch. The portion sizes are huge..."</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
