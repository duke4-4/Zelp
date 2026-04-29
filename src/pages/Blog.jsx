import HeroSlideshow from '../components/HeroSlideshow';
import './InfoPage.css';

const slides = [
  { image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&q=80', eyebrow: 'The Zelp Blog', title: 'Local Insights', subtitle: 'News, tips, and stories from the Zelp community.' },
];

const Blog = () => (
  <div className="info-page">
    <HeroSlideshow slides={slides} />
    <div className="container info-container">
      <h2>Latest Articles</h2>
      <div className="blog-grid">
        {[
          { cat: 'Food & Dining', title: 'The Top 10 Spots for Authentic Sadza in Harare', date: 'April 20, 2026', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80' },
          { cat: 'Small Business', title: 'How to Respond to Customer Reviews Online', date: 'April 15, 2026', img: 'https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&w=600&q=80' },
          { cat: 'Community', title: 'Highlighting Female Entrepreneurs in Bulawayo', date: 'March 28, 2026', img: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=600&q=80' },
        ].map(b => (
          <div key={b.title} className="blog-card">
            <img src={b.img} alt={b.title} />
            <div className="blog-body">
              <div className="blog-category">{b.cat}</div>
              <div className="blog-title">{b.title}</div>
              <div className="blog-date">{b.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Blog;
