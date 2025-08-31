import React from 'react';
import './Admissions.css';
import { Steps } from '../../../public/assets/assets.js';

// Add IT-Ready section below the banner
const ITReadySection = () => (
  <section className="AdmissionsITReady">
    <div className="AdmissionsITReady__text">
      <h2>Are You IT-Ready?</h2>
      <p>Stuck in a rut? Ready for a vibrant career change that promises growth, fulfillment, and stability? Talent Computer Institute welcomes both IT novices and veterans alike. Your spark of ambition is the only prerequisite. With just a High School diploma, GED, or equivalent, you can open doors to a realm of opportunities.</p>
      <p>Our mission? To empower YOU. We bring you more than just theoretical knowledge; we pave your path to tangible success in the dynamic realm of Information Technology. Your potential, combined with our dedicated education and support, is the perfect recipe for success.</p>
    </div>
    <div className="AdmissionsITReady__img-wrap">
      <img src="/assets/img/MyCC.png" alt="Students learning IT" className="AdmissionsITReady__img" />
    </div>
  </section>
);

const AdmissionsSteps = () => (
  <section className="AdmissionsSteps">
    <h2 className="AdmissionsSteps__heading">Journey to Your IT Dream:<br/>The Simple Steps</h2>
    <div className="AdmissionsSteps__list">
      {Steps.map((step, idx) => (
        <div className={`AdmissionsSteps__item${idx % 2 === 1 ? ' AdmissionsSteps__item--alt' : ''}`} key={step.num}>
          <div className="AdmissionsSteps__num">{step.num}</div>
          <div className="AdmissionsSteps__content">
            <div className="AdmissionsSteps__title">{step.title}</div>
            <div className="AdmissionsSteps__desc">{step.desc}</div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const Admissions = () => {
  return (
    <>
      <div className="AdmissionsBanner">
        <div className="AdmissionsBanner__overlay">
          <div className="AdmissionsBanner__content">
            <h1>Start Your IT Journey with Us</h1>
            <p>Admissions are open! Take the first step toward a rewarding career in technology.</p>
          </div>
        </div>
      </div>
      <ITReadySection />
      <AdmissionsSteps />
    </>
  );
};

export default Admissions; 