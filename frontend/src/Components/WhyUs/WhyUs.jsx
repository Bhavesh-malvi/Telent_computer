import React from "react";
import "./WhyUs.css";
import {Link} from 'react-router-dom'

const leftPoints = [
  "In-Demand IT Certifications Tailored for You",
  "Find Your Perfect IT Career with Our Unwavering Support",
  "No IT Experience Needed – We Start from Scratch",
  "Learn on Your Terms with Flexible Options",
  "Fast-Track Your IT Career"
];

const rightPoints = [
  "Lifelong Learning for Ongoing Success",
  "Choose Your Path to IT Success",
  "Certified and Trusted IT Training Institute",
  "Outstanding Training and Instruction",
  "Veterans, Your Transition Starts Here" 
];

const WhyUs = () => (
  <section className="whyus-section">
    <div className="whyus-container">
      <div className="whyus-subtitle">THE TALENT COMPUTER INSTITUTE DIFFERENCE</div>
      <h2 className="whyus-title">Why Us?</h2>
      <p className="whyus-desc">
        It's simple. Talent Computer Institute isn't just another Institute. We think of ourselves as your lifelong IT career development partner.
      </p>
      <div className="whyus-points-row">
        <ul className="whyus-points">
          {leftPoints.map((point, i) => (
            <li key={i}><span className="whyus-icon">◎</span> <b>{point}</b></li>
          ))}
        </ul>
        <ul className="whyus-points">
          {rightPoints.map((point, i) => (
            <li key={i}><span className="whyus-icon">◎</span> <b>{point}</b></li>
          ))}
        </ul>
      </div>
      <Link to="/why-choose-us"><button className="whyus-btn">LEARN MORE</button></Link>
    </div>
  </section>
);

export default WhyUs; 