import React from 'react';
import './Admissions.css';

// Define Steps array directly in the component
const Steps = [
    {
        num: "01",
        title: "Kick-Start With the Application Form",
        desc: "Begin your transformation by providing us with insights into your background, aspirations, and dedication to learning so we can help you choose the right path for you..No jargon, just a straightforward process."
    },
    {
        num: "02",
        title: "Your Academic Journey",
        desc: "Tell us about the training and experience that's brought you where you are and where you aim to go!"
    },
    {
        num: "03",
        title: "Design Your Future: Choose Your Program",
        desc: "Dive deep into our unique career solutions and pick what aligns best with your goals. Not sure which one? Our career, admissions, and financial advisors  are here to assist."
    },
    {
        num: "04",
        title: "Share Your Story",
        desc: "Life is more than just grades and courses. Share any additional information, experiences, or circumstances that you feel should be considered. We value individual stories as they mold unique IT professionals.",
    },
    {
        num: "05",
        title: "Your Education: Invest in Yourself",
        desc: "As a Title IV accredited institution various forms of public and private financial aid are available to our students. Let's see what you qualify for and get you started stress, and hassle free. For those who qualify. Accredited by the Accrediting Council for Continuing Education & Training (ACCET)."
    }
];

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