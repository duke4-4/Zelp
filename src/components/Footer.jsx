import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-grid">
          <div className="footer-col">
            <h3>About Zelp</h3>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/press">Press</Link></li>
              <li><Link to="/investor-relations">Investor Relations</Link></li>
              <li><Link to="/trust-safety">Trust & Safety</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>Discover</h3>
            <ul>
              <li><Link to="/cost-guides">Zelp Project Cost Guides</Link></li>
              <li><Link to="/collections">Collections</Link></li>
              <li><Link to="/talk">Talk</Link></li>
              <li><Link to="/events">Events</Link></li>
              <li><Link to="/blog">Zelp Blog</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>Zelp for Business</h3>
            <ul>
              <li><Link to="/claim-business">Claim your Business Page</Link></li>
              <li><Link to="/advertise">Advertise on Zelp</Link></li>
              <li><Link to="/restaurant-owners">Zelp for Restaurant Owners</Link></li>
              <li><Link to="/success-stories">Business Success Stories</Link></li>
              <li><Link to="/business-support">Business Support</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>Languages</h3>
            <ul>
              <li><Link to="/">English</Link></li>
              <li><Link to="/">Shona</Link></li>
              <li><Link to="/">Ndebele</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>Copyright © 2026 Zelp Inc. Zelp, <span className="brand-z">Z</span>elp logo and related marks are registered trademarks of Zelp.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
