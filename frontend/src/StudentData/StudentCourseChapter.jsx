import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { BookOpen, ChevronDown, ChevronRight, FileText, ArrowLeft } from 'react-feather';
import './StudentCourseChapter.css';

const StudentCourseChapter = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedChapter, setExpandedChapter] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        // Fetch course details (name, image, etc.)
        const courseRes = await axios.get(`/studentcourses/${courseId}`);
        // Fetch chapters for the course
        const chaptersRes = await axios.get(`/chapters/${courseId}`);
        const courseData = courseRes.data?.course || {};
        courseData.chapters = chaptersRes.data || [];
        courseData.totalChapters = courseData.chapters.length;
        setCourse(courseData);
      } catch (err) {
        setError('Failed to fetch course or chapters');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  const handleBackClick = () => navigate('/student-dashboard');
  const toggleChapter = (chapterId) => {
    setExpandedChapter(prev => (prev === chapterId ? null : chapterId));
  };
  const handlePdfClick = (topicName, pdfUrl) => {
    if (pdfUrl) window.open(pdfUrl, '_blank');
  };

  if (loading) return <div className="scc-loading">Loading chapters...</div>;
  if (error) return <div className="scc-error">{error}</div>;
  if (!course) return null;

  return (
    <div className="scc-bg-gradient">
      {/* Top Navigation with Back Button */}
      <div className="scc-navbar">
        <div className="scc-navbar-inner">
          <div className="scc-navbar-flex">
            <button onClick={handleBackClick} className="scc-back-btn">
              <ArrowLeft size={20} />
              <span className="scc-back-btn-text">Back</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="scc-main-content">
        {/* Course Header */}
        <div className="scc-course-header">
          <div className="scc-course-header-flex">
            {/* Course Image */}
            <div className="scc-course-img-wrap">
              <img
                src={course.image}
                alt={course.name}
                className="scc-course-img"
              />
            </div>
            {/* Course Details */}
            <div className="scc-course-details">
              <h1 className="scc-course-title">
                <BookOpen className="scc-course-title-icon" size={32} />
                Course Chapters
              </h1>
              <h2 className="scc-course-name">{course.name}</h2>
              <div className="scc-course-meta">
                <p className="scc-course-meta-text">
                  <span className="scc-course-meta-label">Total Chapters:</span> {course.totalChapters}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chapters Table */}
        <div className="scc-chapters-card">
          <div className="scc-chapters-card-header">
            <h3 className="scc-chapters-card-title">
              <BookOpen size={24} />
              Chapter List
            </h3>
          </div>
          <div className="scc-chapters-list">
            {course.chapters.map((chapter, idx) => (
              <div key={chapter._id || chapter.id} className="scc-chapter-row">
                {/* Chapter Header */}
                <div
                  onClick={() => toggleChapter(chapter._id || chapter.id)}
                  className="scc-chapter-header"
                >
                  <div className="scc-chapter-header-flex">
                    <div className="scc-chapter-header-left">
                      <div className="scc-chapter-number">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="scc-chapter-title">Chapter {idx + 1}</h4>
                        <p className="scc-chapter-name">{chapter.name || chapter.chapterName}</p>
                      </div>
                    </div>
                    <div className="scc-chapter-header-right">
                      <span className="scc-chapter-topic-badge">
                        {chapter.topics.length} Topics
                      </span>
                      {expandedChapter === (chapter._id || chapter.id) ? (
                        <ChevronDown className="scc-chevron" size={24} />
                      ) : (
                        <ChevronRight className="scc-chevron" size={24} />
                      )}
                    </div>
                  </div>
                </div>
                {/* Expanded Topics */}
                {expandedChapter === (chapter._id || chapter.id) && (
                  <div className="scc-chapter-topics">
                    <div className="scc-chapter-topics-inner">
                      <h5 className="scc-chapter-topics-title">
                        <FileText className="scc-chapter-topics-title-icon" size={20} />
                        Topics in this Chapter
                      </h5>
                      {chapter.topics.map((topic, index) => (
                        <div
                          key={topic._id || topic.id || index}
                          className="scc-topic-row"
                        >
                          <div className="scc-topic-row-flex">
                            <div className="scc-topic-number">{index + 1}</div>
                            <span className="scc-topic-name">{topic.name || topic.topicName}</span>
                          </div>
                          {topic.pdf && (
                            <button
                              onClick={() => handlePdfClick(topic.name || topic.topicName, topic.pdf)}
                              className="scc-topic-pdf-btn"
                            >
                              <FileText size={16} />
                              <span>PDF</span>
                            </button>
                          )}
                        </div>
                      ))}
                      {chapter.topics.length === 0 && (
                        <div className="scc-no-topics">No topics found.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCourseChapter; 