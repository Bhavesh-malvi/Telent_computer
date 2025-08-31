import React from "react";
import { useNavigate } from "react-router-dom";
import "./PopularCourses.css";

const courses = [
  {
    id: "mern",
    title: "MERN Stack",
    img: "/assets/img/mern.jpg",
    desc: "Master MongoDB, Express.js, React, and Node.js to build robust full-stack web applications."
  },
  {
    id: "java",
    title: "Java Full Stack",
    img: "/assets/img/javafullstack.webp",
    desc: "Become a Java Full Stack Developer by learning front-end and back-end technologies with Java."
  },
  {
    id: "python",
    title: "Python Full Stack",
    img: "/assets/img/pythonfullstack.jpg",
    desc: "Learn Python for both front-end and back-end development, including Django and modern JS frameworks."
  }
];

const PopularCourses = () => {
  const navigate = useNavigate();
  const handleReadMore = (course) => {
    navigate(`/program/${course.id}`, { state: { course } });
  };
  return (
    <section className="popular-courses-section">
      <div className="popular-courses-header">
        <span className="popular-courses-blog">OUR BLOG</span>
        <h2 className="popular-courses-title">Popular Courses</h2>
        <p className="popular-courses-desc">From career insights to industry trends, we've got you covered.</p>
      </div>
      <div className="popular-courses-cards">
        {courses.map((course) => (
          <div className="popular-courses-card" key={course.id}>
            <img src={course.img} alt={course.title} className="popular-courses-img" />
            <h3 className="popular-courses-card-title">{course.title}</h3>
            <p className="popular-courses-card-desc">{course.desc}</p>
            <button className="popular-courses-readmore" onClick={() => handleReadMore(course)}>
              READ MORE &rarr;
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PopularCourses; 