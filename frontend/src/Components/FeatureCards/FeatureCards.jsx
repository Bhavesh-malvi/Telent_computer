import React from "react";
import { useInView } from "react-intersection-observer";
import "./FeatureCards.css";
import { cards } from "../../../public/assets/assets";



const FeatureCards = () => (
  <>
    <h2 className="feature-cards-title">Building Skills for Tomorrow: Flexible Learning, Real Results</h2>
  <div className="feature-cards-section">
    <div className="feature-cards-row">
      {cards.map((card, i) => {
        const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
        return (
          <div
            ref={ref}
            className={`feature-card ${card.anim} ${inView ? "animate" : ""}`}
            key={i}
          >
            <div className="feature-card-img" style={{ backgroundImage: `url(${card.img})` }} />
            <div className={`feature-card-content ${i === 1 ? "feature-card-orange" : ""}`}>
              <div className="feature-card-icon"><img src={card.icon} alt="icon" /></div>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
  </>
);

export default FeatureCards; 