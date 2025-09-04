import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import StudentForm from "./components/StudentForm";
import StudentList from "./pages/StudentList";
import StudentEnquiry from "./pages/StudentEnquiry";
import CourseManager from "./pages/CourseManager";
import BirthdayPage from "./pages/StudentBirthday";
import StudentDashboard from "./pages/StudentDashboard";
import CourseForm from "./components/CourseForm";
import StudentFee from "./pages/StudentFee";
import IssuesPage from "./pages/IssuesPage";
import Settings from "./pages/Settings";
// import "./styles/Sidebar.css"; // Commented out for compatibility
import "./styles/MainContent.css";
import "./styles/CourseForm.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api, { initializeActivityMonitoring, performLogout } from "./services/api";
import StudentEnrolled from "./pages/StudentEnrolled";
import StudentContact from "./pages/StudentContact";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import ManageChapter from './pages/ManageChapter';
import ExStudentList from "./pages/ExStudentList";
import AssignStaff from "./pages/AssignStaff";
import { io } from 'socket.io-client';

function App() {
  const location = useLocation();
  const [hasBirthdayToday, setHasBirthdayToday] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  // Initialize Socket.IO client
  useEffect(() => {
    if (isLoggedIn && !isValidatingToken) {
      // Initialize Socket.IO client
      const socket = io('https://telent-computer-afh6.onrender.com', {
        transports: ['polling', 'websocket'],
        withCredentials: true,
        timeout: 20000,
        forceNew: true
      });

      // Make socket available globally
      window.io = () => socket;

      // Socket connection events
      socket.on('connect', () => {
        console.log('🔌 Socket.IO connected successfully with ID:', socket.id);
      });

      socket.on('disconnect', () => {
        console.log('🔌 Socket.IO disconnected');
      });

      socket.on('connect_error', (error) => {
        console.error('🔌 Socket.IO connection error:', error);
      });

      socket.on('error', (error) => {
        console.error('🔌 Socket.IO error event:', error);
      });

      // WhatsApp removed

      // Test Socket.IO connection with a simple event
      socket.emit('test-connection', { message: 'Frontend connected', timestamp: new Date().toISOString() });
      console.log('🧪 Test connection event sent to backend');
      
      socket.on('test-response', (data) => {
        console.log('🧪 Test response received from backend:', data);
      });

      // Cleanup on unmount
      return () => {
        socket.disconnect();
        delete window.io;
      };
    }
  }, [isLoggedIn, isValidatingToken]);

  // Validate token on app start
  useEffect(() => {
    const validateTokenOnStart = async () => {
      const token = localStorage.getItem('token');
      if (!isLoggedIn || !token) {
        setIsValidatingToken(false);
        return;
      }

      try {
        await api.get('/auth/validate-token');
        setIsValidatingToken(false);
      } catch (error) {
        console.log('Token validation failed on app start:', error.message);
        
        // Show toast notification
        if (error.response?.status === 401 || error.response?.status === 403) {
          toast.error('Session expired. Please login again.');
        }
        
        // Use performLogout for consistent logout behavior
        performLogout();
        setIsValidatingToken(false);
      }
    };

    validateTokenOnStart();
  }, [isLoggedIn]);

  useEffect(() => {
    api.get('/students/birthday')
      .then(res => setHasBirthdayToday(Array.isArray(res.data) && res.data.length > 0))
      .catch(() => setHasBirthdayToday(false));
  }, [location]);

  // Initialize auto-logout monitoring on app start
  useEffect(() => {
    if (isLoggedIn && !isValidatingToken) {
      console.log('🔧 App: Initializing auto logout monitoring...');
      initializeActivityMonitoring();
    } else {
      console.log('🔧 App: Auto logout not initialized - isLoggedIn:', isLoggedIn, 'isValidatingToken:', isValidatingToken);
    }
  }, [isLoggedIn, isValidatingToken]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
    };
    window.addEventListener('submit', handler, true);
    return () => window.removeEventListener('submit', handler, true);
  }, []);

  // Global error handler for authentication errors
  useEffect(() => {
    const handleGlobalError = (event) => {
      if (event.error && event.error.message && 
          (event.error.message.includes('401') || event.error.message.includes('403'))) {
        console.log('Global authentication error detected');
        performLogout();
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.response && 
          (event.reason.response.status === 401 || event.reason.response.status === 403)) {
        console.log('Global unhandled authentication error detected');
        performLogout();
      }
    });

    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  // Show loading while validating token
  if (isValidatingToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="app-layout bg-white">
      {isLoggedIn && <Sidebar hasBirthdayToday={hasBirthdayToday} />}
      <main className="main-content ml-52">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Routes>
                                <Route path="/" element={<StudentDashboard />} />
                <Route path="/register" element={<StudentForm />} />
                <Route path="/students" element={<StudentList />} />
                <Route path="/enquiries" element={<StudentEnquiry />} />
                <Route path="/issues" element={<IssuesPage />} />
                <Route path="/courses" element={<CourseManager />} />
                <Route path="/addcourse" element={<CourseForm />} />
                <Route path="/birthday" element={<BirthdayPage />} />
                <Route path="/dashboard/:id" element={<StudentDashboard />} />
                <Route path="/studentfee" element={<StudentFee />} />
                <Route path="/enrolled" element={<StudentEnrolled />} />
                <Route path="/contact" element={<StudentContact />} />
                <Route path="/manage-chapter/:courseId" element={<ManageChapter />} />
                <Route path="/ex-students" element={<ExStudentList />} />
                <Route path="/assign-staff" element={
                  <ProtectedRoute allow={['SuperAdmin']}>
                    <AssignStaff />
                  </ProtectedRoute>
                } />

                <Route path="/profile" element={
                  <ProtectedRoute allow={['SuperAdmin']}>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ProtectedRoute>
          } />
        </Routes>
        <ToastContainer 
          position="top-right" 
          autoClose={2500}
          theme="light"
        />
      </main>
    </div>
  );
}

export default App;
