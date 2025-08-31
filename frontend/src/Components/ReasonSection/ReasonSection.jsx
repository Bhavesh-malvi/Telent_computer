import React from 'react';
import { reasons } from '../../../public/assets/assets';
import './ReasonSection.css';

const ReasonSection = () => {
  return (
    <section className="reason-section-wrapper">
      <h2 className="reason-section-title">Why We Are Your Ideal Choice for IT Certification Programs</h2>
      <div className="reason-section-list">
        {reasons.map((reason, idx) => (
          <div className="reason-section-item" key={idx}>
            <div className="reason-section-img-wrap">
              <img src={reason.image} alt={reason.title} className="reason-section-img" />
            </div>
            <div className="reason-section-content">
              <h3 className="reason-section-item-title">{reason.title}</h3>
              <p className="reason-section-item-desc">{reason.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReasonSection; 