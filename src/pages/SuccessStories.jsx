import HeroSlideshow from '../components/HeroSlideshow';
import './InfoPage.css';

const slides = [
  { image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1600&q=80', eyebrow: 'Success Stories', title: 'Local Business Triumphs', subtitle: 'See how Zelp is helping Zimbabwean entrepreneurs grow.' },
];

const SuccessStories = () => (
  <div className="info-page">
    <HeroSlideshow slides={slides} />
    <div className="container info-container">
      <h2>Real Stories from Real Owners</h2>
      <div className="story-grid">
        <div className="story-card">
          <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&w=800&q=80" alt="Restaurant Owner" />
          <div className="story-body">
            <p className="story-quote">"Since claiming our Zelp page, foot traffic has doubled. People read our reviews and instantly know they can trust our food quality."</p>
            <div className="story-owner">Chipo M.</div>
            <div className="story-biz">Owner, Sadza Haven</div>
          </div>
        </div>
        <div className="story-card">
          <img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80" alt="Event Planner" />
          <div className="story-body">
            <p className="story-quote">"Zelp Ads put our new boutique right in front of people searching for fashion in Avondale. The ROI has been incredible."</p>
            <div className="story-owner">Farai N.</div>
            <div className="story-biz">Founder, Style Harare</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SuccessStories;
