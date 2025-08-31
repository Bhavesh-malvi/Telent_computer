import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const isGoogleDriveUrl = (url) => {
  return url && url.includes('drive.google.com');
};

const getEmbeddablePdfUrl = (url) => {
  if (!url) return '';
  
  // Google Drive embed
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }
  
  // Cloudinary PDF with proper parameters for inline display
  if (url.includes('cloudinary.com')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}fl=attachment:false&dl=0&inline=true`;
  }
  
  return url;
};

export default function StudentSelectedCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfError, setPdfError] = useState(false);

  const handleAutoLogout = () => {
    localStorage.removeItem('student');
    navigate('/student-login', { replace: true });
  };

  useEffect(() => {
    async function fetchCourse() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/api/studentcourses/${courseId}`, {
          credentials: 'include',
        });
        const data = await res.json();
        
        if (res.status === 401 || res.status === 403) {
          handleAutoLogout();
          return;
        }
        
        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch course');
        }
        
        if (!data.course || !data.course._id) {
          handleAutoLogout();
          return;
        }
        
        setCourse(data.course);
      } catch (err) {
        console.error('Course fetch error:', err);
        handleAutoLogout();
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [courseId, navigate]);

  const handlePdfError = () => {
    setPdfError(true);
  };

  if (loading) return <div style={{textAlign:'center',padding:'40px'}}>Loading...</div>;
  if (error) return <div style={{color:'red',textAlign:'center',padding:'40px'}}>{error}</div>;
  if (!course) return null;

  const embeddableUrl = getEmbeddablePdfUrl(course.pdf);
  const isCloudinaryPdf = course.pdf && course.pdf.includes('cloudinary.com');

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 32 }}>
      <h2>{course.name}</h2>
      {course.pdf ? (
        <>
          {isGoogleDriveUrl(course.pdf) ? (
            // Google Drive PDF - Use iframe
            <iframe
              src={course.pdf}
              title="Course PDF"
              width="100%"
              height="600px"
              style={{ 
                border: '1px solid #eee', 
                borderRadius: 8, 
                marginTop: 24,
                backgroundColor: '#f8f9fa'
              }}
              allow="autoplay"
            />
          ) : (
            // Regular PDF - Use PDF.js viewer with fallback
            !pdfError ? (
              <div style={{ height: '600px', border: '1px solid #eee', borderRadius: 8, marginTop: 24 }}>
                <Worker workerUrl="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js">
                  <Viewer 
                    fileUrl={course.pdf} 
                    onError={handlePdfError}
                  />
                </Worker>
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                border: '1px solid #eee', 
                borderRadius: 8, 
                marginTop: 24,
                backgroundColor: '#f8f9fa' 
              }}>
                <p style={{ color: '#666', marginBottom: 20 }}>PDF viewer me load nahi ho raha hai</p>
                <a 
                  href={course.pdf} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    background: '#007bff',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  PDF Download Karein
                </a>
              </div>
            )
          )}
          
          {isCloudinaryPdf && (
            <div style={{ 
              background: '#f8f9fa', 
              border: '1px solid #dee2e6', 
              borderRadius: 8, 
              padding: 16, 
              marginTop: 16,
              fontSize: 14,
              color: '#495057'
            }}>
              <strong>Note:</strong> Agar PDF embed nahi ho raha hai, toh:
              <ul style={{ margin: '8px 0 0 20px' }}>
                <li>PDF ko Google Drive par upload karein</li>
                <li>Shareable link banayein</li>
                <li>Admin panel me course edit karke PDF URL update karein</li>
              </ul>
            </div>
          )}
        </>
      ) : (
        <div style={{ color: '#888', marginTop: 32 }}>No PDF available for this course.</div>
      )}
    </div>
  );
} 