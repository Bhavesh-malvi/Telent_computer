import React from "react";
import './Footer.css';
import FooterLogo from '../../assets/img/TCIT Logo White.png';
import footerTopBg from '../../assets/img/footer-top-bg.png';
import { FaFacebookF } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="tcit-footer">
    {/* Top Blue Section */}
    <div className="footer-top-bg" style={{ backgroundImage: `url(${footerTopBg})` }}>
      <div className="footer-top-content">
        <h2 className="footer-top-title">Start Your New Life Today!</h2>
        <p className="footer-top-desc">
          Are you ready to join thousands of graduates thriving in IT careers across the country?<br />
          Take your first step toward an exciting future-speak with an education advisor today!
        </p>
        <Link to="/admissions"><button className="footer-top-btn">TAKE THE FIRST STEP</button></Link>
      </div>
    </div>
    {/* Main Footer Section */}
    <div className="footer-main">
      <div className="footer-section about">
        <img src={FooterLogo} alt="TCIT Logo" className="footer-nav-logo" />
        <p>
          Talent Computer provides training in multiple languages like C, C++, Python, PHP, React, Angular, Web design, DBMS & other Technologies. Talent Computer Training institute offers students an innovative way to learn Technology.
        </p>
        <div className="footer-social">
          <a href="https://www.facebook.com/talentcomputeracademy.ahd" aria-label="Facebook"><FaFacebookF /></a>
          <a href="https://www.instagram.com/talent.computer" aria-label="Instagram"><FaInstagram /></a>
        </div>
      </div>
      <div className="footer-section contact">
        <h3>Contact Us</h3>
        <p>Email: tcit.vastral@gmail.com</p>
        <p>Phone: <a href="tel:+919904365650">+(91) 9904 365 650</a>, <a href="tel:+919265283173">+(91) 9265 283 173</a></p>
        <p><b>Branch -1:</b> Raj Ratan Complex, Rajendra Park Char Rasta, Nr. Kaka Bhaji Pav, Odhav, Ahmedabad - 382415</p>
        <p><b>Branch -2:</b> H/F 11 Sahaj Residency, Above Shreeji Batteries, Takshashila School Rd, Char Rasta, Vastral, Ahmedabad, Gujarat 382418</p>
      </div>
      <div className="footer-section pages"> 
        <h3>Pages</h3>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/why-choose-us">Why Us</Link></li>
          <li><Link to="/about-us">About Us</Link></li>
          <li><Link to="/courses">Courses</Link></li>
          <li><Link to="/admissions">Admission</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>
      </div>
    </div>
    <div className="footer-bottom">
      <span>Copyright ©{new Date().getFullYear()} All rights reserved </span>
      <span>BenchMark Websoft Solutions</span>
    </div>
  </footer>
);

export default Footer; 