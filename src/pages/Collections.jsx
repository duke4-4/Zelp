import HeroSlideshow from '../components/HeroSlideshow';
import './InfoPage.css';

const slides = [
  { image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=1600&q=80', eyebrow: 'Collections', title: 'Curated Local Lists', subtitle: 'Hand-picked lists of the best places in town.' },
];

const Collections = () => (
  <div className="info-page">
    <HeroSlideshow slides={slides} />
    <div className="container info-container">
      <h2>Popular Collections</h2>
      <div className="collections-grid">
        {[
          { title: 'Best Date Night Spots', img: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=600&q=80' },
          { title: 'Top Sadza Joints', img: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80' },
          { title: 'Reliable Auto Mechanics', img: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=600&q=80' },
        ].map(c => (
          <div key={c.title} className="collection-card">
            <img src={c.img} alt={c.title} />
            <div className="collection-label">
              <span>{c.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Collections;
