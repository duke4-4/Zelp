import HeroSlideshow from '../components/HeroSlideshow';
import './InfoPage.css';

const slides = [
  { image: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1600&q=80', eyebrow: 'Press & Media', title: 'Zelp in the News', subtitle: 'Read the latest coverage about Zelp.' },
];

const Press = () => (
  <div className="info-page">
    <HeroSlideshow slides={slides} />
    <div className="container info-container">
      <h2>Recent Press</h2>
      <div className="press-grid">
        {[
          { outlet: 'The Herald', date: 'October 12, 2026', headline: 'Zelp officially launches in Harare to help locals find trusted businesses.' },
          { outlet: 'TechZim', date: 'September 28, 2026', headline: 'How Zelp is reshaping the digital discovery landscape in Zimbabwe.' },
          { outlet: 'Sunday Mail', date: 'August 15, 2026', headline: 'Local startup Zelp secures funding to expand to Bulawayo and Mutare.' },
        ].map(item => (
          <div key={item.headline} className="press-card">
            <div className="press-outlet">{item.outlet}</div>
            <div className="press-headline">{item.headline}</div>
            <div className="press-date">{item.date}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Press;
