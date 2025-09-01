import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./PopularLanguages.css";

// Import images
import javascript from "../../assets/img/javascript.png";
import python from "../../assets/img/python.png";
import java from "../../assets/img/java.png";
import cpp from "../../assets/img/cpp.png";
import php from "../../assets/img/php.png";
import sql from "../../assets/img/sql.png";
import vuejs from "../../assets/img/vuejs.png";
import mongodb from "../../assets/img/mongodb.png";
import nodejs from "../../assets/img/nodejs.png";
import react from "../../assets/img/react.png";

const languages = [
      { img: javascript, title: "JavaScript" },
      { img: python, title: "Python" },
      { img: java, title: "Java" },
      { img: cpp, title: "C++" },
      { img: php, title: "PHP" },
      { img: sql, title: "SQL" },
      { img: vuejs, title: "Vue.js" },
      { img: mongodb, title: "MongoDB" },
      { img: nodejs, title: "Node.js" },
      { img: react, title: "React" },
];

const sliderSettings = {
  infinite: true,
  speed: 900,
  slidesToShow: 5,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 1500,
  responsive: [
    { breakpoint: 1200, settings: { slidesToShow: 4 } },
    { breakpoint: 900, settings: { slidesToShow: 3 } },
    { breakpoint: 600, settings: { slidesToShow: 2 } },
    { breakpoint: 400, settings: { slidesToShow: 1 } },
  ],
  arrows: false,
  dots: false,
  pauseOnHover: false,
};

export default function PopularLanguages() {
  return (
    <section className="popular-languages-section">
      <h2 className="popular-languages-title">Popular Programming Languages & Libraries</h2>
      <Slider {...sliderSettings} className="popular-languages-slider">
        {languages.map((lang, i) => (
          <div className="popular-language-card" key={i}>
            <img src={lang.img} alt={lang.title} className="popular-language-img" />
            <div className="popular-language-name">{lang.title}</div>
          </div>
        ))}
      </Slider>
    </section>
  );
} 