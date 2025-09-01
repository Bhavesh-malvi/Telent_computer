import React, { useState } from 'react';
import './AboutContent.css';

const aboutData = [
  {
    img: '/src/assets/img/our-story.jpg',
    title: 'Our Stories',
    desc: `TCIT offers Administrative & Software Development courses based on today's hottest technologies, including PHP, Python, JAVA, .NET, Wordpress, Magento, Tally, D.T.P and many more Technologies.`
  },
  {
    img: '/src/assets/img/mission.jpg',
    title: 'Our Mission',
    desc: `To nurture talent in vibrant minds and to provide conducive environment for faculty and students and turn them in to dynamic & result oriented professionals of global stature.`
  },
  {
    img: '/src/assets/img/vision.jpg',
    title: 'Our Vision',
    desc: `To be widely recognized as one of the best and most innovative center of relevant and high quality Information Technology and Business programs.`
  }
];

const whyChooseList = [
  {
    title: 'ISO 9001-2015 Certified Institute',
    desc: 'We are a government recognized and ISO certified institute, ensuring quality education and standards.'
  },
  {
    title: "+ You're learning from the best.",
    desc: 'Our trainers are highly qualified and experienced in their respective fields, providing you with the best learning experience.'
  },
  {
    title: 'Affordable Price',
    desc: 'We offer all our courses at affordable prices so that everyone can access quality IT education.'
  },
  {
    title: 'Access to high-speed Wi-Fi.',
    desc: 'Our campus is equipped with high-speed Wi-Fi to support your learning and research needs.'
  },
  {
    title: 'Practical Learning Environment.',
    desc: 'We focus on hands-on training and real-world projects to ensure you gain practical skills.'
  },
  {
    title: 'Post Training Support',
    desc: 'We provide post-training support and career guidance to help you succeed in your IT career.'
  },
  {
    title: 'Experience Faculty',
    desc: 'Our faculty members have years of industry experience and are dedicated to your success.'
  }
];

export default function AboutContent() {
  const [openIdx, setOpenIdx] = useState(null);
  const handleToggle = idx => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="about-content-section">
      <h2 className="about-content-title">Welcome To TCIT</h2>
      <p className="about-content-intro">
        Talent Computer journey started in the year 2015. In this long time span, we have gained a tremendous experience in the field of programming and engineering. We are a team of qualified trainers with a vast experience in fields like Web Development, Web designing, Accounting Training etc. TCIT is specialized in computer-related training. The organization goes out of the way to groom the trainees into industry ready professional by enriching their knowledge in specific domains as well as with full module of soft skill training
      </p>
      <div className="about-content-cards">
        {aboutData.map((item, idx) => (
          <div className="about-content-card" key={idx}>
            <img src={item.img} alt={item.title} className="about-content-img" />
            <h3 className="about-content-card-title">{item.title}</h3>
            <p className="about-content-card-desc">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="about-whychoose-row">
        <ul className="about-whychoose-list">
          {whyChooseList.map((item, idx) => (
            <li key={idx} className={`about-whychoose-accordion${openIdx === idx ? ' open' : ''}`} onClick={() => handleToggle(idx)}>
              <div className="about-whychoose-accordion-title-row">
                <span className={`about-whychoose-arrow${openIdx === idx ? ' open' : ''}`}>▶</span>
                <span className="about-whychoose-accordion-title">{item.title}</span>
              </div>
              <div className="about-whychoose-accordion-desc" style={{ maxHeight: openIdx === idx ? '200px' : '0', opacity: openIdx === idx ? 1 : 0, padding: openIdx === idx ? '12px 13px 8px 60px' : '0 0', transition: 'all 0.3s cubic-bezier(.4,0,.2,1)' }}>{item.desc}</div>
            </li>
          ))}
        </ul>
        <div className="about-whychoose-img-wrap">
          <img src="/src/assets/img/aboutbanner.jpg" alt="Why Choose Us" className="about-whychoose-img" />
        </div>
      </div>
    </section>
  );
} 