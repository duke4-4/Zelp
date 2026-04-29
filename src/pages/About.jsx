import HeroSlideshow from '../components/HeroSlideshow';
import './InfoPage.css';

const slides = [
  { image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1600&q=80', eyebrow: 'Our Story', title: 'About Zelp', subtitle: 'Built by Zimbabweans, for Zimbabweans.' },
  { image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80', eyebrow: 'Our Mission', title: 'Connecting Communities', subtitle: 'We help great local businesses get discovered.' },
];

const About = () => (
  <div className="info-page">
    <HeroSlideshow slides={slides} />
    <div className="container info-container">
      <h2>Who We Are</h2>
      <p>Zelp is Zimbabwe's leading local business discovery platform. Founded in Harare, we connect millions of Zimbabweans with the best restaurants, services, and experiences across the country. We believe that every great local business deserves to be found — and every customer deserves honest, trusted reviews from real people in their community.</p>

      <h2>Our Values</h2>
      <div className="values-grid">
        {[
          { icon: '🇿🇼', title: 'Proudly Zimbabwean', desc: 'Built in Harare, for communities from Bulawayo to Mutare and everywhere in between.' },
          { icon: '✅', title: 'Trust & Authenticity', desc: 'Every review on Zelp is from a verified real user. No fake ratings, ever.' },
          { icon: '🤝', title: 'Community First', desc: 'We champion small businesses and help them thrive in Zimbabwe\'s growing digital economy.' },
          { icon: '📱', title: 'Built for Mobile', desc: 'Zelp works seamlessly on any device — from the latest smartphones to entry-level handsets.' },
        ].map(v => (
          <div key={v.title} className="value-card">
            <span className="value-icon">{v.icon}</span>
            <h3>{v.title}</h3>
            <p>{v.desc}</p>
          </div>
        ))}
      </div>

      <h2>Our Reach</h2>
      <div className="stats-grid">
        {[
          { stat: '5,000+', label: 'Businesses Listed' },
          { stat: '120,000+', label: 'Monthly Users' },
          { stat: '10', label: 'Cities Covered' },
          { stat: '50,000+', label: 'Reviews Written' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-num">{s.stat}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default About;
