import HeroSlideshow from '../components/HeroSlideshow';
import './InfoPage.css';

const slides = [
  { image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80', eyebrow: 'Careers at Zelp', title: 'Join Our Team', subtitle: 'Help us build the future of local discovery in Zimbabwe.' },
];

const Careers = () => (
  <div className="info-page">
    <HeroSlideshow slides={slides} />
    <div className="container info-container">
      <h2>Work With Us</h2>
      <p>At Zelp, we are passionate about connecting people with great local businesses. We are looking for talented individuals who share our vision and want to make a real impact in Zimbabwe's digital landscape.</p>

      <h2>Open Positions</h2>
      <div className="jobs-grid">
        {[
          { title: 'Senior React Developer', dept: 'Engineering', location: 'Harare (Hybrid)' },
          { title: 'Community Manager', dept: 'Marketing', location: 'Harare' },
          { title: 'Business Development Executive', dept: 'Sales', location: 'Bulawayo' },
        ].map(job => (
          <div key={job.title} className="job-card">
            <div>
              <div className="job-title">{job.title}</div>
              <div className="job-meta">
                <span>{job.location}</span>
                <span className="job-dept">{job.dept}</span>
              </div>
            </div>
            <button className="btn btn-green">Apply Now</button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Careers;
