import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import './StudentDashboard.css';
import { User, HelpCircle, LogOut, Hash, Mail, BookOpen, Eye } from 'react-feather';
import axiosInstance from '../../api/axios';

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [issueText, setIssueText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [chapterCounts, setChapterCounts] = useState({});
  const navigate = useNavigate();
  
  // Refs to prevent unnecessary re-fetching
  const dataFetched = useRef(false);
  const chapterCountsFetched = useRef(false);
  const lastFetchTime = useRef(0);

  useEffect(() => {
    const fetchProfile = async () => {
      // Check if data was recently fetched (within last 30 seconds)
      const now = Date.now();
      if (dataFetched.current && (now - lastFetchTime.current) < 30000) {
        // Use cached data from localStorage
        const storedStudent = localStorage.getItem('student');
        if (storedStudent) {
          try {
            const parsedStudent = JSON.parse(storedStudent);
            setStudent(parsedStudent);
            setLoading(false);
            return;
          } catch {
            // If parsing fails, proceed with API call
          }
        }
      }

      try {
        setLoading(true);
        setError('');
        const storedStudent = localStorage.getItem('student');
        if (!storedStudent) throw new Error('No stored student data');
        const parsedStoredStudent = JSON.parse(storedStudent);
        const token = parsedStoredStudent.token;
        const { data } = await axios.get('/auth/profile');
        if (!data || !data.student) throw new Error('Invalid profile data received');
        const updatedStudent = { ...data.student, token };
        setStudent(updatedStudent);
        localStorage.setItem('student', JSON.stringify(updatedStudent));
        
        // Mark as fetched and update timestamp
        dataFetched.current = true;
        lastFetchTime.current = now;
      } catch (err) {
        console.error('Dashboard Error:', err);
        localStorage.removeItem('student');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        setError(err.response?.data?.message || err.message || 'Failed to load profile');
        setTimeout(() => {
          navigate('/student-login', { replace: true, state: { error: err.response?.data?.message || err.message } });
        }, 2000);
      } finally {
        setLoading(false); // Removed unnecessary timeout
      }
    };
    fetchProfile();
  }, [navigate]); // Keep navigate dependency but with optimized caching

  useEffect(() => {
    const fetchChapterCounts = async () => {
      if (!student || !student.selectedCourses) return;
      
      // Always fetch fresh chapter counts to ensure accuracy
      console.log('Fetching chapter counts for courses:', student.selectedCourses.map(c => c.courseName || c.name));
      
      const counts = {};
      await Promise.all(
        student.selectedCourses.map(async (course) => {
          try {
            const courseId = course._id || course.id;
            console.log(`Fetching chapters for course: ${course.courseName || course.name} (ID: ${courseId})`);
            const res = await axiosInstance.get(`/chapters/${courseId}`);
            const chapterCount = Array.isArray(res.data) ? res.data.length : 0;
            counts[courseId] = chapterCount;
            console.log(`Course ${course.courseName || course.name}: ${chapterCount} chapters`);
          } catch (error) {
            console.error(`Error fetching chapters for course ${course.courseName || course.name}:`, error);
            counts[course._id || course.id] = 0;
          }
        })
      );
      
      console.log('Final chapter counts:', counts);
      setChapterCounts(counts);
      chapterCountsFetched.current = true;
      
      // Cache chapter counts in localStorage
      localStorage.setItem(`chapterCounts_${student._id}`, JSON.stringify(counts));
    };
    fetchChapterCounts();
  }, [student]);



  const handleLogoutClick = async () => {
    try {
      setLoading(true);
      await axios.post('/auth/logout');
      // Clear all cached data on logout
      localStorage.removeItem('student');
      if (student?._id) {
        localStorage.removeItem(`chapterCounts_${student._id}`);
      }
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      navigate('/student-login', { replace: true });
    } catch {
      localStorage.removeItem('student');
      if (student?._id) {
        localStorage.removeItem(`chapterCounts_${student._id}`);
      }
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      navigate('/student-login', { replace: true });
    }
  };

  // Help dialog logic
  const handleHelpClick = () => setIsHelpOpen(true);
  const handleHelpClose = () => {
    setIsHelpOpen(false);
    setIssueText('');
    setSubmitError('');
    setSubmitSuccess('');
  };
  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    if (!issueText.trim()) {
      setSubmitError('Please enter your issue');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await axios.post('/issues', { studentId: student.studentId, description: issueText });
      setSubmitSuccess('Issue submitted successfully!');
      setIssueText('');
      // Immediately close dialog on success
      setTimeout(() => {
        setIsHelpOpen(false);
        setSubmitSuccess('');
      }, 1500); // Reduced delay to 1.5 seconds
    } catch (err) {
      // On error, dialog remains open and shows error
      setSubmitError(err.response?.data?.message || 'Failed to submit issue. Please try again.');
      // Don't close dialog, let user see the error and retry or manually close
    } finally {
      setIsSubmitting(false);
    }
  };

  // Image edit logic
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setImageError('Image size should be less than 1MB');
        return;
      }
      setSelectedImage(file);
      setImageError('');
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      setImageError('Please select an image');
      return;
    }
    setIsUploadingImage(true);
    setImageError('');
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      const { data } = await axios.post('/auth/update-profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStudent(prev => ({ ...prev, image: data.image }));
      const storedStudent = JSON.parse(localStorage.getItem('student') || '{}');
      localStorage.setItem('student', JSON.stringify({ ...storedStudent, image: data.image }));
      setIsImageDialogOpen(false);
      setSelectedImage(null);
      setImagePreview('');
    } catch (err) {
      setImageError(err.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };



  if (loading) {
    return (
      <div className="sd-loading-container">
        <div className="sd-loading-card">
          <div className="sd-loading-spinner"></div>
          <p className="sd-loading-text">Loading your dashboard...</p>
          <div className="sd-loading-progress">
            <div className="sd-loading-progress-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sd-error-container">
        <div className="sd-error-card">
          <div className="sd-error-icon">⚠️</div>
          <h3 className="sd-error-title">Error Loading Dashboard</h3>
          <p className="sd-error-message">{error}</p>
          <p className="sd-error-message">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="sd-dashboard-bg">
      {/* Fixed Top Navigation Bar */}
      <div className="sd-navbar sd-navbar-fixed">
        <div className="sd-navbar-inner">
          <div className="sd-navbar-left">
            {/* Remove the welcome/name div entirely */}
          </div>
          <div className="sd-navbar-right">
            <button onClick={handleHelpClick} className="sd-navbar-btn sd-navbar-help">
              <HelpCircle size={20} />
              <span>Help</span>
            </button>
            <button onClick={handleLogoutClick} className="sd-navbar-btn sd-navbar-logout">
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Help Dialog */}
      {isHelpOpen && (
        <div className="sd-dialog-overlay">
          <div className="sd-dialog">
            <div className="sd-dialog-header">
              <h3>Submit an Issue</h3>
              <button onClick={handleHelpClose} className="sd-dialog-close">×</button>
            </div>
            <form onSubmit={handleSubmitIssue} className="sd-dialog-content">
              {submitError && <div className="sd-dialog-error">{submitError}</div>}
              {submitSuccess && <div className="sd-dialog-success">{submitSuccess}</div>}
              <textarea
                value={issueText}
                onChange={e => {
                  setIssueText(e.target.value);
                  // Clear error when user starts typing
                  if (submitError) setSubmitError('');
                }}
                placeholder="Please describe your issue here..."
                className="sd-dialog-textarea"
                disabled={isSubmitting}
              />
              <div className="sd-dialog-actions">
                <button type="button" onClick={handleHelpClose} className="sd-dialog-cancel" disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="sd-dialog-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Upload Dialog */}
      {isImageDialogOpen && (
        <div className="sd-dialog-overlay">
          <div className="sd-dialog">
            <div className="sd-dialog-header">
              <h3>Update Profile Picture</h3>
              <button onClick={() => { setIsImageDialogOpen(false); setSelectedImage(null); setImagePreview(''); setImageError(''); }} className="sd-dialog-close">×</button>
            </div>
            <form onSubmit={handleImageUpload} className="sd-dialog-content">
              {imageError && <div className="sd-dialog-error">{imageError}</div>}
              <label className="sd-image-upload-area" style={{ cursor: 'pointer' }}>
                {imagePreview ? (
                  <div className="sd-image-preview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                ) : (
                  <div className="sd-image-upload-placeholder">
                    <span>Click to select image or drag and drop</span>
                    <small>Max size: 1MB</small>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="sd-image-input"
                  style={{ display: 'none' }}
                />
              </label>
              <div className="sd-dialog-actions">
                <button type="button" onClick={() => { setIsImageDialogOpen(false); setSelectedImage(null); setImagePreview(''); setImageError(''); }} className="sd-dialog-cancel" disabled={isUploadingImage}>Cancel</button>
                <button type="submit" className="sd-dialog-submit" disabled={isUploadingImage || !selectedImage}>
                  {isUploadingImage ? 'Uploading...' : 'Save Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="sd-main-content" style={{ padding: '12px' }}>
        {/* Student Information Section */}
        <div className="sd-student-info-card" style={{ padding: '16px' }}>
          <h2 className="sd-section-title sd-student-info-title" style={{ 
            margin: '0 0 12px 0', 
            fontSize: '20px',
            padding: '0'
          }}>
            <User className="sd-section-title-icon" size={24} />
            Student Information
          </h2>
          <div className="sd-student-info-flex" style={{ gap: '16px', padding: '0' }}>
            <div className="sd-student-info-img-wrap" style={{ flexShrink: 0 }}>
              <div className="sd-student-info-img-outer"
                onMouseEnter={e => e.currentTarget.classList.add('sd-navbar-avatar-hover')}
                onMouseLeave={e => e.currentTarget.classList.remove('sd-navbar-avatar-hover')}
              >
                <img
                  src={student.image}
                  alt={student.name}
                  className="sd-student-info-img"
                  onClick={() => setIsImageDialogOpen(true)}
                  style={{ cursor: 'pointer' }}
                />
                <div className="sd-student-info-img-overlay" onClick={() => setIsImageDialogOpen(true)}>
                  Edit
                </div>
              </div>
            </div>
            <div className="sd-student-info-details" style={{ padding: '8px 16px', gap: '12px' }}>
              <div className="sd-student-info-detail sd-student-info-id" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '8px 12px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                minHeight: 'auto'
              }}>
                <div className="sd-student-info-detail-label" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  flex: '0 0 auto'
                }}>
                  <Hash className="sd-student-info-detail-label-icon" size={18} />
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Student ID:</span>
                </div>
                <p className="sd-student-info-detail-value" style={{ 
                  margin: '0', 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>{student.studentId || student.id}</p>
              </div>
              <div className="sd-student-info-detail sd-student-info-email" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '8px 12px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                minHeight: 'auto'
              }}>
                <div className="sd-student-info-detail-label" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  flex: '0 0 auto'
                }}>
                  <Mail className="sd-student-info-detail-label-icon" size={18} />
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Email:</span>
                </div>
                <p className="sd-student-info-detail-value" style={{ 
                  margin: '0', 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1e293b',
                  wordBreak: 'break-all'
                }}>{student.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <div className="sd-courses-card" style={{ padding: '16px', marginTop: '12px' }}>
          <h2 className="sd-section-title sd-courses-title" style={{ 
            margin: '0 0 12px 0', 
            fontSize: '20px',
            padding: '0'
          }}>
            <BookOpen className="sd-section-title-icon" size={24} />
            My Courses
            <span className="sd-courses-count" style={{ fontSize: '14px' }}>
              {student.selectedCourses ? student.selectedCourses.length : 0} Enrolled
            </span>
          </h2>
          <div className="sd-courses-grid" style={{ gap: '12px', padding: '0' }}>
            {(student.selectedCourses || []).map((course, idx) => (
              <div key={course._id || course.id || idx} className="sd-course-card">
                <div className="sd-course-img-wrap">
                  <img
                    src={course.courseImage || course.image}
                    alt={course.courseName || course.name}
                    className="sd-course-img"
                  />
                  <div className="sd-course-img-overlay" />
                  <div className="sd-course-img-title">
                    <h3 className="sd-course-img-title-text">
                      {course.courseName || course.name}
                    </h3>
                  </div>
                </div>
                <div className="sd-course-details">
                  <div className="sd-course-details-row">
                    <div className="sd-course-details-chapters">
                      <BookOpen size={16} />
                      <span>{chapterCounts[course._id || course.id] ?? 0} Chapters</span>
                    </div>
                    <div className="sd-course-status-active">Active</div>
                  </div>
                  <Link to={`/student-course-chapter/${course._id || course.id}`} className="sd-course-view-btn">
                    <Eye size={18} />
                    View Chapters
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 