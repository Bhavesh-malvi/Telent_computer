import React from "react";
import "./HomeAboutUs.css";
// import programmersImg from "../../assets/img/programmers.jpg";
// import logoImg from "../../assets/img/logo.png";

const HomeAboutUs = () => (
  <section className="aboutus-cta-section">
    <div className="aboutus-cta-container">
      <div className="aboutus-cta-content">
        <h2 className="aboutus-cta-title">Choose Your Path To IT Success</h2>
        <p className="aboutus-cta-desc">
          At Talent Computer Institute, the skills and certifications you gain will unlock opportunities across a range of IT career paths. Whether your passion lies in lab simulation troubleshooting or intricate security engineering, we're here to equip you for the ideal career path.
        </p>
        <a href="/contact"><button className="aboutus-cta-btn">GET STARTED</button></a>
      </div>
      <div className="aboutus-cta-image-wrap">
        <img src="/assets/img/programmers.jpg" alt="Programmers working together" className="aboutus-cta-image" />
        <div className="aboutus-cta-logo-overlay">
          <img src="/assets/img/logo.png" alt="Logo" className="aboutus-cta-logo" />
        </div>
      </div>
    </div>
  </section>
);

export default HomeAboutUs; 