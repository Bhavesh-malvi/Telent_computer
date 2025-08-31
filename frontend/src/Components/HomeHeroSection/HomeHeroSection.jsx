import React from "react";
import "./HomeHeroSection.css";
// import videoBg from "../../assets/img/NewHomeVideo.mp4";

const HomeHeroSection = () => {
  return (
    <div className="hero-container">
      <video className="hero-bg-video" src="/assets/img/NewHomeVideo.mp4" autoPlay loop muted playsInline />
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h4>WELCOME TO TALENT COMPUTER INSTITUTE</h4>
        <h1>
          Get Started & Get Ahead in Your <br />
          IT Professional Career
        </h1>
        <h2>Which Path is Right for You?</h2>
        <div className="hero-cards">
          <div className="hero-card">
            <h3>NEW to IT </h3>
            <p>Start your IT career in months, not years.</p>
          </div>
          <div className="hero-divider"></div>
          <div className="hero-card">
            <h3>IT Professionals</h3>
            <p>Upskill and advance your career.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeHeroSection; 