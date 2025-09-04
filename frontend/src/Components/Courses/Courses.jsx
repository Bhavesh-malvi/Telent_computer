import React, { useState, useEffect } from "react";
import "./Courses.css";
import { API_URL } from "../../config/api";
import axios from "axios";
import fallbackImg from "../../assets/img/course1.jpeg";
import { Link } from "react-router-dom";

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/studentcourses`);
      // Map backend fields to match old UI usage
      const mappedCourses = (res.data || []).map(course => ({
        ...course,
        title: course.name, // for UI compatibility
        desc: course.description, // for UI compatibility
      }));
      setCourses(mappedCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourses([]);
    } finally {
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
          Whether you're learning on campus or through our live online programs, our industry-expert instructors provide a comprehensive education. Our lab-based approach prepares you for certification tests and real-world skills you'll need in your future workplace.
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