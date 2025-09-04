import { NavLink, useNavigate } from "react-router-dom";
import { stopActivityMonitoring } from "../services/api";
import API_CONFIG from '../config/apiConfig.js';
import {
  FaBirthdayCake,
  FaSignOutAlt,
  FaTachometerAlt,
  FaUsers,
  FaBook,
  FaUserCheck,
  FaEnvelope,
  FaBell,
  FaUserGraduate,
  FaUserCog,
  FaRupeeSign,
  FaUser,
  
} from "react-icons/fa";

const navItems = [
  {
    to: "/",
    label: "Dashboard",
    icon: <FaTachometerAlt className="text-blue-600" size={20} />,
  },
  {
    to: "/students",
    label: "Student List",
    icon: <FaUsers className="text-blue-600" size={20} />,
  },
  {
    to: "/enquiries",
    label: "Student Enquiries",
    icon: <FaUsers className="text-orange-600" size={20} />,
  },
  {
    to: "/ex-students",
    label: "Ex-Student List",
    icon: <FaUserGraduate className="text-green-600" size={20} />,
  },
  {
    to: "/studentfee",
    label: "Student Fee",
    icon: <FaRupeeSign  className="text-blue-600" size={20} />,
  },
  {
    to: "/issues",
    label: "Student Issues",
    icon: <FaBell className="text-blue-600" size={20} />,
  },
  {
    to: "/courses",
    label: "Course Manager",
    icon: <FaBook className="text-blue-600" size={20} />,
  },
  {
    to: "/birthday",
    label: "Birthday Page",
    icon: null, // will be set dynamically
  },
  {
    to: "/enrolled",
    label: "Enrolled Students",
    icon: <FaUserCheck className="text-blue-600" size={20} />,
  },
  {
    to: "/assign-staff",
    label: "Assign Staff",
    icon: <FaUserCog className="text-purple-600" size={20} />,
  },

  {
    to: "/contact",
    label: "Contact",
    icon: <FaEnvelope className="text-blue-600" size={20} />,
  },
  {
    to: "/profile",
    label: "Profile",
    icon: <FaUser className="text-gray-600" size={20} />,
  },
];

const Sidebar = ({ hasBirthdayToday }) => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || '';
  const username = localStorage.getItem('username') || (role.toLowerCase().includes('super') ? 'SuperAdmin' : '');
  const lastLoginAt = localStorage.getItem('lastLoginAt');
  const roleLower = role.toLowerCase();
  const isClerk = roleLower.includes('clerk');
  const isSuperAdmin = roleLower.includes('superadmin');
  const handleLogout = async () => {
    try {
      // Attempt backend logout to clear presence for staff
      const token = localStorage.getItem('token');
      await fetch(`${API_CONFIG.BASE_URL}/api/auth/staff/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined,
        },
      });
      console.log('Manual logout - backend called successfully');
    } catch (error) {
      console.log('Manual logout - backend call failed:', error.message);
    }
    
    // Stop auto-logout monitoring
    stopActivityMonitoring();
    
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('scopeCategory');
    localStorage.removeItem('staffId');
    localStorage.removeItem('username');
    localStorage.removeItem('lastLoginAt');
    sessionStorage.removeItem('isActive');
    
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 z-40 h-full min-h-screen w-18 md:w-[216px] bg-gradient-to-b from-blue-50 to-indigo-100 shadow-xl flex flex-col py-6 px-2 md:px-4 overflow-y-auto scrollbar-hide">
      <ul className="flex-1 space-y-2">
        {navItems
          .filter((item) => {
            if (item.to === '/assign-staff') return isSuperAdmin;
            if (item.to === '/profile') return isSuperAdmin;
            if (item.to === '/register' || item.to === '/addcourse' || item.to === '/studentfee') return !isClerk;
            return true;
          })
          .map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              state={item.to === '/studentfee' ? { fromSidebar: true } : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-blue-600/40 text-white shadow'
                    : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                }`
              }
            >
              <span className="text-lg">
                {item.to === "/birthday"
                  ? (
                      hasBirthdayToday
                        ? <FaBirthdayCake className="text-pink-500 animate-bounce" size={20} />
                        : <FaBirthdayCake className="text-pink-500" size={20} />
                    )
                  : item.icon}
              </span>
              <span className="hidden md:inline truncate">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors duration-200 text-red-600 hover:bg-red-50"
        >
          <FaSignOutAlt className="text-red-600" size={20} />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;