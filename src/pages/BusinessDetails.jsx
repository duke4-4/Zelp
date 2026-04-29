import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Phone, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import './BusinessDetails.css';

const BusinessDetails = () => {
  const { id } = useParams();

  // Mock data for business details
  const biz = {
    name: "Paula's Place",
    category: "Zimbabwean, African",
    rating: 4.5,
    reviews: 128,
    price: "$$",
    address: "Samora Machel Ave, Harare",
    phone: "+263 24 2700000",
    website: "paulasplace.co.zw",
    images: [
      "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=400&q=80"
    ]
  };

  return (
    <div className="business-details-page">
      <div className="biz-photo-header">
        {biz.images.map((img, i) => (
          <img key={i} src={img} alt={`${biz.name} photo ${i + 1}`} className={i === 0 ? "featured-image" : "side-image desktop-only"} />
        ))}
      </div>

      <div className="container biz-container">
        <div className="biz-main">
          <h1 className="biz-title">{biz.name}</h1>
          <div className="rating-row-large">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={24} className={i < Math.floor(biz.rating) ? "star-filled" : ""} color={i < Math.floor(biz.rating) ? "var(--primary-yellow)" : "#ccc"} />
              ))}
            </div>
            <span className="review-count-large">{biz.rating} ({biz.reviews} reviews)</span>
          </div>
          
          <div className="tags-row-large">
            <span className="claimed-badge"><CheckCircle size={16} /> Claimed</span>
            <span className="price-tag">{biz.price}</span>
            <span className="category-tag">{biz.category}</span>
          </div>

          <div className="action-buttons">
            <button className="btn btn-primary"><Star size={18} /> Write a Review</button>
            <button className="btn btn-secondary">Add Photo</button>
            <button className="btn btn-secondary">Share</button>
            <button className="btn btn-secondary">Save</button>
          </div>

          <div className="biz-section">
            <h2>Location & Hours</h2>
            <div className="location-hours-grid">
              <div className="map-placeholder">
                <MapPin size={32} color="var(--primary-green)" />
                <p>Interactive Map</p>
              </div>
              <div className="hours-list">
                <div className="hours-row"><span>Mon</span><span>11:00 AM - 10:00 PM</span></div>
                <div className="hours-row"><span>Tue</span><span>11:00 AM - 10:00 PM</span></div>
                <div className="hours-row"><span>Wed</span><span>11:00 AM - 10:00 PM</span></div>
                <div className="hours-row"><span>Thu</span><span>11:00 AM - 10:00 PM</span></div>
                <div className="hours-row"><span>Fri</span><span>11:00 AM - 11:00 PM</span></div>
                <div className="hours-row"><span>Sat</span><span>11:00 AM - 11:00 PM</span></div>
                <div className="hours-row"><span>Sun</span><span>11:00 AM - 9:00 PM</span></div>
              </div>
            </div>
          </div>

          <div className="biz-section">
            <h2>Recommended Reviews</h2>
            <div className="review-card">
              <div className="reviewer-info">
                <div className="avatar"></div>
                <div>
                  <strong>John D.</strong>
                  <span>Harare, ZW</span>
                </div>
              </div>
              <div className="review-rating">
                <div className="stars">
                  <Star size={16} className="star-filled" />
                  <Star size={16} className="star-filled" />
                  <Star size={16} className="star-filled" />
                  <Star size={16} className="star-filled" />
                  <Star size={16} className="star-filled" />
                </div>
                <span>10/24/2026</span>
              </div>
              <p className="review-text">This place is incredible! The sadza and nyama were cooked to perfection. The atmosphere is extremely welcoming and vibrant. Will definitely be coming back!</p>
            </div>
          </div>
        </div>

        <div className="biz-sidebar desktop-only">
          <div className="info-box">
            <div className="info-row">
              <a href={`http://${biz.website}`} target="_blank" rel="noopener noreferrer">{biz.website}</a>
              <ExternalLink size={20} />
            </div>
            <div className="info-row">
              <span>{biz.phone}</span>
              <Phone size={20} />
            </div>
            <div className="info-row">
              <div className="address-block">
                <a href="#map">Get Directions</a>
                <span>{biz.address}</span>
              </div>
              <MapPin size={20} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetails;
