import { BarChart3, Users, BookOpen, UserCog } from 'lucide-react';

const Header = () => {
  // Get user information from localStorage
  const role = localStorage.getItem('role') || '';
  const username = localStorage.getItem('username') || (role.toLowerCase().includes('super') ? 'SuperAdmin' : '');
  const lastLoginAt = localStorage.getItem('lastLoginAt');

  return (
    <header className="bg-white  shadow-sm border-b border-gray-200  transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 dark:bg-blue-500 p-2 rounded-lg transition-colors duration-300">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900  transition-colors duration-300">Student Dashboard</h1>
              <p className="text-sm text-gray-500  transition-colors duration-300">Analytics & Insights</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Logged-in user information */}
            <div className="flex items-center space-x-2 bg-white/70 border border-blue-100 px-3 py-2 rounded-lg">
              <UserCog className="h-4 w-4 text-blue-700" />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] text-gray-500">Logged in as</span>
                <span className="text-xs font-semibold text-gray-800">{username || role || 'SuperAdmin'}</span>
                {lastLoginAt && (
                  <span className="text-[9px] text-gray-500">Last login: {new Date(lastLoginAt).toLocaleString()}</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 bg-blue-50  px-3 py-2 rounded-lg transition-colors duration-300">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 ">Active Dashboard</span>
            </div>
            <div className="flex items-center space-x-2 bg-green-50  px-3 py-2 rounded-lg transition-colors duration-300">
              <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 ">Live Data</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;