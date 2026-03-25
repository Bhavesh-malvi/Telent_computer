import Navbar from './Components/Navbar/Navbar'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home from './Pages/Home/Home'
import Program from './Pages/Program/Program';
import Reason from './Pages/Reason/Reason';
import React, { useEffect } from 'react';
import AboutUs from './Pages/AboutUs/AboutUs';
import CoursesMain from './Pages/CoursesMain/CoursesMain';
import Admissions from './Pages/Admissions/Admissions';
import Contact from './Pages/Contact/Contact';
import StudentLogin from './StudentData/StudentLogin/StudentLogin';
import StudentDashboard from './StudentData/StudentDashboard/StudentDashboard';
import MainLayout from './Components/MainLayout';
import StudentLayout from './StudentData/StudentLayout';
import ProtectedRoute from './StudentData/ProtectedRoute';
import StudentSelectedCourse from './StudentData/StudentSelectedCourse';
import StudentCourseChapter from './StudentData/StudentCourseChapter';
import StudentExam from './StudentData/StudentExam/StudentExam';

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/program/:id" element={<Program />} />
        <Route path="/why-choose-us" element={<Reason />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/courses" element={<CoursesMain />} />
        <Route path="/admissions" element={<Admissions />} />
        <Route path="/contact" element={<Contact />} />
        </Route>
        <Route element={<StudentLayout />}>
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/student-dashboard" element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student-exam/:attemptId" element={
            <ProtectedRoute>
              <StudentExam />
            </ProtectedRoute>
          } />
          <Route path="/student-course/:courseId" element={
            <ProtectedRoute>
              <StudentSelectedCourse />
            </ProtectedRoute>
          } />
          <Route path="/student-course-chapter/:courseId" element={
            <ProtectedRoute>
              <StudentCourseChapter />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
