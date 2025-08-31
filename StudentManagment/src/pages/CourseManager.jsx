import React, { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { BookOpen, Edit, Trash2, Plus, Search, List, Layers, MoreVertical } from "react-feather";
import { toast } from "react-toastify";

const CourseCard = ({ course, onEdit, onDelete, onChapters, formatCurrency }) => (
  <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-gray-100">
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Course Image */}
      <div className="flex-shrink-0 mx-auto sm:mx-0">
        {course.image ? (
          <img src={course.image} alt={course.name} className="w-14 h-14 rounded-full object-cover border-2 border-blue-100" onError={e => { e.target.onerror = null; e.target.src = '/default-course.png'; }} />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>
      {/* Course Information - single line */}
      <div className="flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-4 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{course.name}</h3>
            <span className="text-sm text-gray-500 truncate">Created: {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A'}</span>
            <span className="text-sm text-gray-600 truncate">Fees: <span className="font-medium text-blue-700">{formatCurrency(course.fees)}</span></span>
            {course.category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">{course.category}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 whitespace-nowrap">{course.duration || 'N/A'} Month</span>
             <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const menu = document.getElementById(`course-menu-${course._id}`);
                // Close all other menus first
                document.querySelectorAll('[id^="course-menu-"]').forEach(m => { 
                  if (m.id !== `course-menu-${course._id}`) m.classList.add('hidden'); 
                });
                const willOpen = menu.classList.contains('hidden');
                if (willOpen) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const menuHeight = 120; // Approximate menu height
                  const windowHeight = window.innerHeight;
                  const spaceBelow = windowHeight - rect.bottom;
                  const spaceAbove = rect.top;
                  
                  // Check if there's enough space below, if not, position above
                  if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
                    // Position above the button
                    menu.style.top = `${rect.top - menuHeight - 6}px`;
                  } else {
                    // Position below the button (default)
                    menu.style.top = `${rect.bottom + 6}px`;
                  }
                  
                  // Horizontal positioning - ensure it doesn't go off-screen
                  const menuWidth = 176; // w-44 = 176px
                  const spaceRight = window.innerWidth - rect.right;
                  
                  if (spaceRight < menuWidth) {
                    // Position to the left of the button
                    menu.style.left = `${rect.left - menuWidth + 40}px`; // 40px for button width
                  } else {
                    // Position to the right of the button (default)
                    menu.style.left = `${rect.right - menuWidth}px`;
                  }
                  
                  // Highlight the course card
                  const card = e.currentTarget.closest('.bg-white');
                  if (card) {
                    card.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
                    card.style.borderLeft = '3px solid #3b82f6';
                  }
                } else {
                  // Remove highlight when closing menu
                  const card = e.currentTarget.closest('.bg-white');
                  if (card) {
                    card.style.backgroundColor = '';
                    card.style.borderLeft = '';
                  }
                }
                menu.classList.toggle('hidden');
              }}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              data-course-menu
              title="Actions"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            <div id={`course-menu-${course._id}`} className="hidden w-44 bg-white rounded-lg shadow-2xl border border-gray-200 z-50" style={{ 
              position: 'fixed', 
              top: '-10000px', 
              left: '-10000px',
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <div className="py-1">
                {!( (localStorage.getItem('role')||'').toLowerCase().includes('clerk') ) && (
                  <button onClick={() => { onEdit(course); document.getElementById(`course-menu-${course._id}`)?.classList.add('hidden'); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"><Edit className="w-4 h-4" /> Edit</button>
                )}
                <button onClick={() => { onChapters(course); document.getElementById(`course-menu-${course._id}`)?.classList.add('hidden'); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"><Layers className="w-4 h-4" /> Chapters</button>
                {!( (localStorage.getItem('role')||'').toLowerCase().includes('clerk') || (localStorage.getItem('role')||'').toLowerCase().includes('manager') ) && (
                  <button onClick={() => { onDelete(course); document.getElementById(`course-menu-${course._id}`)?.classList.add('hidden'); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CourseManager = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const COURSES_PER_PAGE = 5;

  useEffect(() => { 
    fetchCourses(); 
    
    // Add click outside handler to close menus
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-course-menu]')) {
        document.querySelectorAll('[id^="course-menu-"]').forEach(menu => {
          menu.classList.add('hidden');
          // Remove highlight from all cards
          const cards = document.querySelectorAll('.bg-white');
          cards.forEach(card => {
            card.style.backgroundColor = '';
            card.style.borderLeft = '';
          });
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/studentcourses");
      let processedCourses = response.data.map(course => ({ ...course, fees: parseFloat(course.fees) || 0 }));
      const scopeCategory = localStorage.getItem('scopeCategory') || 'All';
      if (scopeCategory !== 'All') {
        processedCourses = processedCourses.filter(c => (c.category || '').toLowerCase() === scopeCategory.toLowerCase());
      }
      setCourses(processedCourses);
      setError('');
    } catch {
      setError('Failed to fetch courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (course) => {
    try {
      await api.delete(`/studentcourses/${course._id}`);
      setCourses(courses.filter(c => c._id !== course._id));
      toast.success('Course deleted successfully');
    } catch {
      toast.error('Failed to delete course');
    }
  };

  const handleEdit = (course) => {
    navigate('/addcourse', { state: { course } });
  };
  const handleChapters = (course) => {
    navigate(`/manage-chapter/${course._id}`);
  };

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    return courses
      .filter(course => {
        const searchTermLower = searchTerm.toLowerCase();
        const matchesSearch = (
          course.name.toLowerCase().includes(searchTermLower) ||
          course.fees.toString().includes(searchTerm)
        );
        const matchesCategory = (
          categoryFilter === 'All' || (course.category || '').toLowerCase() === categoryFilter.toLowerCase()
        );
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        if (sortBy === 'fees') {
          aValue = parseFloat(aValue) || 0;
          bValue = parseFloat(bValue) || 0;
        } else if (sortBy === 'createdAt') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        } else {
          aValue = (aValue || '').toLowerCase();
          bValue = (bValue || '').toLowerCase();
        }
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
  }, [courses, searchTerm, sortBy, sortOrder, categoryFilter]);

  // Reset to first page when filters/sort/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedCourses.length / COURSES_PER_PAGE));
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * COURSES_PER_PAGE;
    const end = start + COURSES_PER_PAGE;
    return filteredAndSortedCourses.slice(start, end);
  }, [filteredAndSortedCourses, currentPage]);

  // Stats
  const totalCourses = courses.length;
  const totalFees = courses.reduce((sum, course) => sum + (parseFloat(course.fees) || 0), 0);
  const averageFees = totalCourses > 0 ? (totalFees / totalCourses).toFixed(0) : 0;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-blue-600 font-semibold">Loading courses...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Course Manager</h1>
            </div>
            {!( (localStorage.getItem('role')||'').toLowerCase().includes('clerk') ) && (
              <button className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium" onClick={() => navigate('/addcourse')}>
                <Plus className="w-4 h-4" />
                Add Course
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Courses</h3>
            <p className="text-3xl font-bold text-blue-600">{totalCourses}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Value</h3>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(totalFees)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Fee</h3>
            <p className="text-3xl font-bold text-purple-600">{formatCurrency(averageFees)}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by course name or fees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            {/* Category Filter */}
            {!( (localStorage.getItem('role')||'').toLowerCase().includes('clerk') || (localStorage.getItem('role')||'').toLowerCase().includes('manager') ) && (
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-gray-500" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="All">All</option>
                  <option value="IT">IT</option>
                  <option value="Basic">Basic</option>
                </select>
              </div>
            )}
            {/* Sort */}
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="name">Course Name</option>
                <option value="fees">Fees</option>
                <option value="createdAt">Date Created</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="inline-flex items-center px-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-600 text-center mb-4 font-semibold">
          <span>⚠️ {error}</span>
          <button onClick={fetchCourses} className="ml-4 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Retry</button>
        </div>
      )}

      {/* Course List */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="space-y-4">
          {filteredAndSortedCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          ) : (
            paginatedCourses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onChapters={handleChapters}
                formatCurrency={formatCurrency}
              />
            ))
          )}
        </div>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="bg-white px-4 py-3 border border-gray-200 rounded-md flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * COURSES_PER_PAGE) + 1} to {Math.min(currentPage * COURSES_PER_PAGE, filteredAndSortedCourses.length)} of {filteredAndSortedCourses.length} courses
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Close any open course menus when clicking outside or on scroll */}
      <script dangerouslySetInnerHTML={{
        __html: `
          function closeMenus(event){
            const isMenuButton = event && event.target && event.target.closest ? event.target.closest('[data-course-menu]') : null;
            const anyMenu = document.querySelectorAll('[id^="course-menu-"]');
            anyMenu.forEach(menu => {
              if (!event || (!menu.contains(event.target) && !isMenuButton)) {
                menu.classList.add('hidden');
              }
            });
          }
          document.addEventListener('click', closeMenus);
          window.addEventListener('scroll', () => closeMenus());
        `
      }} />
    </div>
  );
};

export default CourseManager; 