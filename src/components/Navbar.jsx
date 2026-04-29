import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Menu, X, User } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate('/search');
  };

  return (
    <header className="navbar glass">
      <div className="container nav-container">
        <Link to="/" className="brand">
          <span className="brand-z">Z</span>elp
        </Link>

        <form className="search-bar" onSubmit={handleSearch}>
          <div className="search-input-group">
            <input type="text" placeholder="tacos, cheap dinner, Max's" />
          </div>
          <div className="search-divider"></div>
          <div className="search-input-group">
            <input type="text" placeholder="Harare, ZW" defaultValue="Harare, ZW" />
            <MapPin size={18} className="icon-location" />
          </div>
          <button type="submit" className="search-btn btn-primary">
            <Search size={20} />
          </button>
        </form>

        <nav className="nav-links desktop-only">
          <Link to="/write-review" className="nav-link">Write a Review</Link>
          <Link to="/login" className="btn btn-secondary">Log In</Link>
          <Link to="/signup" className="btn btn-primary">Sign Up</Link>
        </nav>

        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <form className="mobile-search-bar" onSubmit={handleSearch}>
            <input type="text" placeholder="tacos, cheap dinner, Max's" className="mobile-input" />
            <input type="text" placeholder="Harare, ZW" className="mobile-input" />
            <button type="submit" className="btn btn-primary w-full">Search</button>
          </form>
          <Link to="/write-review" className="mobile-link">Write a Review</Link>
          <Link to="/login" className="mobile-link">Log In</Link>
          <Link to="/signup" className="mobile-link">Sign Up</Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
