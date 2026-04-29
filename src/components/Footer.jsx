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
              <li><Link to="/">About Us</Link></li>
              <li><Link to="/">Careers</Link></li>
              <li><Link to="/">Press</Link></li>
              <li><Link to="/">Investor Relations</Link></li>
              <li><Link to="/">Trust & Safety</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>Discover</h3>
            <ul>
              <li><Link to="/">Zelp Project Cost Guides</Link></li>
              <li><Link to="/">Collections</Link></li>
              <li><Link to="/">Talk</Link></li>
              <li><Link to="/">Events</Link></li>
              <li><Link to="/">Zelp Blog</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>Zelp for Business</h3>
            <ul>
              <li><Link to="/">Claim your Business Page</Link></li>
              <li><Link to="/">Advertise on Zelp</Link></li>
              <li><Link to="/">Zelp for Restaurant Owners</Link></li>
              <li><Link to="/">Business Success Stories</Link></li>
              <li><Link to="/">Business Support</Link></li>
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
