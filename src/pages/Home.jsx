import { Link } from 'react-router-dom';
import { Utensils, Wrench, Car, MoreHorizontal, Star } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="container hero-container">
          <h1 className="hero-title">Zelp, tailored for Zimbabwe</h1>
          <div className="categories-grid">
            <Link to="/search?q=restaurants" className="category-card hover-lift">
              <Utensils size={32} />
              <span>Restaurants</span>
            </Link>
            <Link to="/search?q=home-services" className="category-card hover-lift">
              <Wrench size={32} />
              <span>Home Services</span>
            </Link>
            <Link to="/search?q=auto-services" className="category-card hover-lift">
              <Car size={32} />
              <span>Auto Services</span>
            </Link>
            <Link to="/search?q=more" className="category-card hover-lift">
              <MoreHorizontal size={32} />
              <span>More</span>
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
