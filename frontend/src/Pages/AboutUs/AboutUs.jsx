import React from 'react'
import './AboutUs.css'
import AboutContent from '../../Components/AboutContent/AboutContent'

const AboutUs = () => {
  return (
    <>
      <div className="AboutUsBanner">
        <div className="AboutUsBanner__overlay">
          <div className="AboutUsBanner__content">
            <h1>About Us: Empowering Your IT Journey</h1>
            <p>At Talent Computer Institute, we are committed to transforming lives through quality IT education, hands-on training, and lifelong career support. Discover our mission, values, and commitment to your success.</p>
          </div>
        </div>
      </div>
      <AboutContent />
    </>
  )
}

export default AboutUs