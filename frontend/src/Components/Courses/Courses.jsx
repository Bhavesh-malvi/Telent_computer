import React, { useState, useEffect } from "react";
import "./Courses.css";
import { API_URL } from "../../config/api";
import axios from "axios";
import fallbackImg from "../../assets/img/course1.jpeg";
import { Link } from "react-router-dom";
import { StudentData } from "../../assets/assets";

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
  setLoading(true);
  scrollTo(0,0)

  // Creates a promise that rejects after 2 seconds
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request Timeout")), 2000)
  );

  try {
    // Race between API request & timeout
    const res = await Promise.race([
      axios.get(`${API_URL}/api/studentcourses`),
      timeoutPromise
    ]);

    const mappedCourses = (res.data || []).map(course => ({
      ...course,
      title: course.name,
      desc: course.description,
    }));

    setCourses(mappedCourses);
    console.log("✔ Live API running");

  } catch (err) {
    console.warn("⚠ Live API slow/failed, use fallback static data...", err);

    const mappedFallback = (StudentData || []).map(course => ({
      ...course,
      title: course.name,
      desc: course.description,
    }));

    setCourses(mappedFallback);
  }finally {
    setLoading(false);
  }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return(
    <>
    {loading ? (
      <div>Loading...</div>
    ) : (
    <section className="courses-section">
      <div className="courses-header">
        <div className="courses-subtitle">OUR PROGRAMS</div>
        <h2 className="courses-title">IT Training & Courses</h2>
        <p className="courses-desc">
          Whether you're starting fresh or pivoting mid-career, our comprehensive training programs open the door to the dynamic world of Information Technology.
        </p>
      </div>
      <div className="courses-grid">
        {(courses || []).slice(0, 3).map((course, i) => (
          <div className="course-card-modern" key={i}>
            <div className="course-card-modern-left">
              <div className="course-img-modern-wrap">
                <img 
                  src={course.image || fallbackImg} 
                  alt={course.title} 
                  className="course-img-modern"
                  onError={(e) => {
                    e.target.src = fallbackImg;
                  }}
                />
                <div className="course-badge-modern">{course.badge}</div>
              </div>
            </div>
            <div className="course-card-modern-right">
              <h3 className="course-title-modern">{course.title}</h3>
              <p className="course-desc-modern">{course.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
        <Link to="/courses"><button className="view-more-courses-btn">View More Courses</button></Link>
      </div>
    </section>
    )}
  </>
  )
};

export default Courses; 