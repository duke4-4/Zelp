import HeroSlideshow from '../components/HeroSlideshow';
import './InfoPage.css';

const slides = [
  { image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80', eyebrow: 'Business Support', title: 'We\'re Here to Help', subtitle: 'Resources and support for Zelp business owners.' },
];

const BusinessSupport = () => (
  <div className="info-page">
    <HeroSlideshow slides={slides} />
    <div className="container info-container">
      <h2>Frequently Asked Questions</h2>
      <div className="faq-list">
        <div className="faq-item">
          <div className="faq-question">How do I claim my business page? <span>+</span></div>
          <div className="faq-answer">Simply search for your business on Zelp, click the "Claim this business" button, and follow the verification steps. It's completely free!</div>
        </div>
        <div className="faq-item">
          <div className="faq-question">Can I pay to remove a bad review? <span>+</span></div>
          <div className="faq-answer">No. We maintain strict neutrality. Businesses cannot pay to alter or remove their reviews. We encourage owners to publicly respond to negative feedback instead.</div>
        </div>
        <div className="faq-item">
          <div className="faq-question">How do Zelp Ads work? <span>+</span></div>
          <div className="faq-answer">Zelp Ads appear above organic search results when users look for your specific services in your city. You only pay when someone clicks on your ad.</div>
        </div>
      </div>
      <div className="page-cta">
        <h2>Still need help?</h2>
        <p>Our support team in Harare is ready to assist you Monday through Friday.</p>
        <button className="btn">Contact Support</button>
      </div>
    </div>
  </div>
);

export default BusinessSupport;
