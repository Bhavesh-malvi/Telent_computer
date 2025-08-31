import React from 'react';
import './CoursesMain.css';
import { ClockIcon } from '@radix-ui/react-icons';
import { useEffect } from 'react';
import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';


const CoursesMain = () => {
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
  
  return (
    <>
    {loading ? (
      <div>Loading...</div>
    ) : (
      <>
      <div className="CoursesMainBanner">
        <div className="CoursesMainBanner__overlay">
          <div className="CoursesMainBanner__content">
            <h1>Powerful IT Courses & Programs</h1>
            <p>Whether you're embarking on a fresh journey or pivoting mid-career, our comprehensive training programs promise a gateway to the dynamic world of Information Technology.</p>
          </div>
        </div>
      </div>
      <div className="courses-grid coursesmain-modern-grid">
        {(courses || []).map((course, idx) => (
          <div className="course-card-modern" key={idx}>
            <div className="course-card-modern-left">
              <div className="course-img-modern-wrap">
                <img 
                  src={course.image || '/assets/img/course1.jpeg'} 
                  alt={course.title} 
                  className="course-img-modern"
                  onError={(e) => {
                    e.target.src = '/assets/img/course1.jpeg';
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
      </>
    )}
    </>
  );
};

export default CoursesMain;
