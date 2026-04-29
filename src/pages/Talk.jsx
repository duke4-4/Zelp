import HeroSlideshow from '../components/HeroSlideshow';
import './InfoPage.css';

const slides = [
  { image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80', eyebrow: 'Zelp Talk', title: 'Community Forums', subtitle: 'Join the conversation with locals.' },
];

const Talk = () => (
  <div className="info-page">
    <HeroSlideshow slides={slides} />
    <div className="container info-container">
      <h2>Trending Discussions in Harare</h2>
      <div className="topic-list">
        {[
          { title: 'Best internet service provider in Avondale?', replies: 42, author: 'Tendai M.' },
          { title: 'Looking for a reliable plumber urgently', replies: 15, author: 'Sarah K.' },
          { title: 'New restaurant opening at Sam Levy\'s Village', replies: 89, author: 'David T.' },
        ].map(t => (
          <div key={t.title} className="topic-card">
            <div>
              <div className="topic-title">{t.title}</div>
              <div className="topic-meta">Started by {t.author}</div>
            </div>
            <div className="topic-count">
              <strong>{t.replies}</strong>
              <span>replies</span>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-green">Start a Discussion</button>
    </div>
  </div>
);

export default Talk;
