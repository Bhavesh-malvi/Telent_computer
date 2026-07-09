import React from 'react';
import './Admissions.css';
import { Steps } from '../../assets/assets';
import myCCImg from '../../assets/img/MyCC.png';
import { useSEO } from '../../hooks/useSEO';


// Define Steps array directly in the component


// Add IT-Ready section below the banner
const ITReadySection = () => (
  <section className="AdmissionsITReady">
    <div className="AdmissionsITReady__text">
      <h2>Are You IT-Ready?</h2>
      <p>Feeling stuck? Ready for a vibrant career change that offers <span style={{fontWeight: 700}}>growth, fulfillment, and stability</span>? Talent Computer Institute welcomes both IT novices and experienced professionals. Your spark of ambition is the only prerequisite. With just a <span style={{fontWeight:700}}>High School diploma, GED, or equivalent,</span> you can unlock a world of opportunities.</p>
      <p>Our mission? To <span style={{fontWeight:700}}>empower YOU</span>. We providing more than theoretical knowledge; we guid you toward tangible success in the dynamic world of Information Technology. Your potential, combined with our dedicated training and support, creates the perfect recipe for success.</p>
    </div>
    <div className="AdmissionsITReady__img-wrap">
      <img src={myCCImg} alt="Students learning IT" className="AdmissionsITReady__img" />
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
  useSEO({
    title: "Admissions Open | Talent Computer Institute",
    description: "Start your IT career journey today. Check our simple enrollment steps, course options and eligibility criteria for coding classes at TCIT.",
    keywords: "tcit admissions, computer courses entry, join coding institute vastral"
  });

  return (
    <>
      <div className="AdmissionsBanner">
        <div className="AdmissionsBanner__overlay">
          <div className="AdmissionsBanner__content">
            <h1>Start Your IT Journey with Us</h1>
            <p>Admissions are now open! Take the first step toward a <span style={{fontWeight: 700}}>rewarding career in technology.</span></p>
          </div>
        </div>
      </div>
      <ITReadySection />
      <AdmissionsSteps />
    </>
  );
};

export default Admissions; 