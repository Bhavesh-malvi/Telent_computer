import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./PopularLanguages.css";

const languages = [
      { img: '/assets/img/javascript.png', title: "JavaScript" },
      { img: '/assets/img/python.png', title: "Python" },
      { img: '/assets/img/java.png', title: "Java" },
      { img: '/assets/img/cpp.png', title: "C++" },
      { img: '/assets/img/php.png', title: "PHP" },
      { img: '/assets/img/sql.png', title: "SQL" },
      { img: '/assets/img/vuejs.png', title: "Vue.js" },
      { img: '/assets/img/mongodb.png', title: "MongoDB" },
      { img: '/assets/img/nodejs.png', title: "Node.js" },
      { img: '/assets/img/react.png', title: "React" },
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