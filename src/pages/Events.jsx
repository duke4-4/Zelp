import HeroSlideshow from '../components/HeroSlideshow';
import './InfoPage.css';

const slides = [
  { image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=80', eyebrow: 'Local Events', title: 'What\'s Happening', subtitle: 'Discover festivals, concerts, and meetups.' },
];

const Events = () => (
  <div className="info-page">
    <HeroSlideshow slides={slides} />
    <div className="container info-container">
      <h2>Upcoming Events in Harare</h2>
      <div className="events-grid">
        {[
          { title: 'Harare International Festival of the Arts', date: 'April 28', loc: 'Harare Gardens', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80' },
          { title: 'Food & Wine Tasting', date: 'May 5', loc: 'Amanzi Restaurant', img: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80' },
        ].map(e => (
          <div key={e.title} className="event-card">
            <img src={e.img} alt={e.title} />
            <div className="event-body">
              <div className="event-date-badge">{e.date}</div>
              <div className="event-title">{e.title}</div>
              <div className="event-location">📍 {e.loc}</div>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-green">View All Events</button>
    </div>
  </div>
);

export default Events;
