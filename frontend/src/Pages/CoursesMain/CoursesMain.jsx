import React from 'react';
import './CoursesMain.css';
import { ClockIcon } from '@radix-ui/react-icons';
import { useEffect } from 'react';
import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import fallbackImg from '../../assets/img/course1.jpeg';
import FilterSelect from '../../Components/UI/FilterSelect';
import { StudentData } from '../../assets/assets';

const CoursesMain = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTitle, setSelectedTitle] = useState('All');

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

  // Titles should depend on selected category
  const titlesFromCategory = (courses || [])
    .filter(c => selectedCategory === 'All' || (c.category || '') === selectedCategory)
    .map(c => c.title)
    .filter(Boolean);
  const courseTitles = ['All', ...Array.from(new Set(titlesFromCategory))]
    .sort((a, b) => (a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b)));

  const filteredCourses = (courses || []).filter(course => {
    const matchesCategory = selectedCategory === 'All' || (course.category || '') === selectedCategory;
    const matchesTitle = selectedTitle === 'All' || course.title === selectedTitle;
    return matchesCategory && matchesTitle;
  });
  
  const categoryOptions = [
    { value: 'All', label: 'All Categories' },
    { value: 'Basic', label: 'Basic' },
    { value: 'IT', label: 'IT' },
  ];

  const titleOptions = courseTitles.map(t => ({ value: t, label: t === 'All' ? 'All Courses' : t }));
  
  return (
    <>
    {loading ? (
      <div>Loading...</div>
    ) : (
      <>
      <div className="CoursesMainBanner" >
        <div className="CoursesMainBanner__overlay">
          <div className="CoursesMainBanner__content">
            <h1>Powerful IT Courses & Programs</h1>
            <p>Whether you're embarking on a fresh journey or pivoting mid-career, our comprehensive training programs promise a gateway to the dynamic world of Information Technology.</p>
          </div>
        </div>
      </div>

      <div className="courses-filters">
        <FilterSelect
          value={selectedCategory}
          onChange={(v) => { setSelectedCategory(v); setSelectedTitle('All'); }}
          options={categoryOptions}
          className="courses-filter-select"
          placeholder="Select Category"
        />
        <FilterSelect
          value={selectedTitle}
          onChange={(v) => setSelectedTitle(v)}
          options={titleOptions}
          className="courses-filter-select"
          placeholder="Select Course"
        />
      </div>

      <div className="courses-grid coursesmain-modern-grid">
        {(filteredCourses || []).map((course, idx) => (
          <div className="course-card-modern" key={idx}>
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
      </>
    )}
    </>
  );
};

export default CoursesMain;
