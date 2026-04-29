import { Link } from 'react-router-dom';
import { Star, MessageSquare } from 'lucide-react';
import './SearchResults.css';

const SearchResults = () => {
  const results = [
    { id: 1, name: "Paula's Place", category: "Zimbabwean, African", rating: 4.5, reviews: 128, price: "$$", address: "Samora Machel Ave, Harare", phone: "+263 24 2700000", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80" },
    { id: 2, name: "Coimbra Restaurant", category: "Portuguese, Seafood", rating: 4.0, reviews: 89, price: "$$$", address: "61 Selous Ave, Harare", phone: "+263 24 2700001", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80" },
    { id: 3, name: "Amanzi Restaurant", category: "International, Fusion", rating: 4.8, reviews: 210, price: "$$$$", address: "158 Enterprise Rd, Harare", phone: "+263 24 2700002", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=400&q=80" },
    { id: 4, name: "Pariah State Borrowdale", category: "Bar, Pub Food", rating: 4.2, reviews: 156, price: "$$", address: "Borrowdale Village, Harare", phone: "+263 24 2700003", image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=400&q=80" },
  ];

  return (
    <div className="search-results-page">
      <div className="container results-container">
        <div className="filters-sidebar desktop-only">
          <h3>Filters</h3>
          <div className="filter-group">
            <h4>Price</h4>
            <div className="price-filters">
              <button className="price-btn">$</button>
              <button className="price-btn active">$$</button>
              <button className="price-btn">$$$</button>
              <button className="price-btn">$$$$</button>
            </div>
          </div>
          <div className="filter-group">
            <h4>Features</h4>
            <label className="checkbox-label"><input type="checkbox" /> Good for Groups</label>
            <label className="checkbox-label"><input type="checkbox" /> Has TV</label>
            <label className="checkbox-label"><input type="checkbox" /> Outdoor Seating</label>
          </div>
        </div>

        <div className="results-list">
          <h2 className="results-header">Best Restaurants in Harare, ZW</h2>
          
          {results.map((biz, index) => (
            <div key={biz.id} className="result-card hover-lift">
              <img src={biz.image} alt={biz.name} className="result-image" />
              <div className="result-info">
                <h3><Link to={`/biz/${biz.id}`}>{index + 1}. {biz.name}</Link></h3>
                <div className="rating-row">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} className={i < Math.floor(biz.rating) ? "star-filled" : ""} color={i < Math.floor(biz.rating) ? "var(--primary-yellow)" : "#ccc"} />
                    ))}
                  </div>
                  <span className="review-count">{biz.reviews} reviews</span>
                </div>
                <div className="tags-row">
                  <span className="tag">{biz.category}</span>
                  <span className="price-tag">{biz.price}</span>
                </div>
                <p className="address">{biz.address}</p>
                <div className="review-snippet-row">
                  <MessageSquare size={16} />
                  <p>"Absolutely amazing food! The vibe is great and the service is top notch."</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
