import React, { useState, useEffect } from 'react';
import api from '../services/api';
// import './StudentEnrolled.css';

const StudentEnrolled = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch enrollments data
  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/enrollments');
      setEnrollments(response.data.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch enrollments. Please try again.');
      console.error('Error fetching enrollments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete enrollment
  const handleDelete = async (id) => {
    try {
      await api.delete(`/enrollments/${id}`);
      setEnrollments(enrollments.filter(enrollment => enrollment._id !== id));
      setError('');
    } catch (err) {
      setError('Failed to delete enrollment. Please try again.');
      console.error('Error deleting enrollment:', err);
    }
  };

  // Filter and sort enrollments
  const filteredAndSortedEnrollments = enrollments
    .filter(enrollment => {
      const matchesSearch = enrollment.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           enrollment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           enrollment.phone.includes(searchTerm);
      const matchesCourse = filterCourse === '' || enrollment.course === filterCourse;
      return matchesSearch && matchesCourse;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Get unique courses for filter
  const uniqueCourses = [...new Set(enrollments.map(enrollment => enrollment.course))];

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
          <p className="text-blue-700 font-semibold">Loading enrollments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-2 md:px-8">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg px-8 py-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Student Enrollments</h1>
            <p className="text-blue-100">Manage and view all student enrollment records</p>
          </div>
        </div>
      </div>

      {/* Filters and Search Section */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative w-full max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white shadow-sm"
            />
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            <option value="">All Courses</option>
            {uniqueCourses.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            <option value="createdAt">Date</option>
            <option value="fullName">Name</option>
            <option value="course">Course</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white shadow-sm text-lg font-bold text-blue-700 hover:bg-blue-50 transition"
            title="Toggle sort order"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-6xl mx-auto mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
          <span>⚠️ {error}</span>
          <button onClick={fetchEnrollments} className="ml-auto px-4 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 font-semibold transition">Retry</button>
        </div>
      )}

      {/* Enrollments Table */}
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-x-auto">
        {filteredAndSortedEnrollments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="text-5xl mb-2">📝</div>
            <h3 className="text-lg font-bold mb-1">No enrollments found</h3>
            <p className="text-sm">
              {searchTerm || filterCourse 
                ? 'Try adjusting your search or filter criteria'
                : 'No students have enrolled yet'
              }
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Student Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Course</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Enrolled Date</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredAndSortedEnrollments.map((enrollment) => (
                <tr key={enrollment._id} className="hover:bg-blue-50 transition">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shadow">
                      {enrollment.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{enrollment.fullName}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${enrollment.email}`} className="text-blue-600 underline hover:text-blue-800 transition">
                      {enrollment.email}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`tel:${enrollment.phone}`} className="text-blue-700 font-semibold hover:underline">
                      {enrollment.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">
                      {enrollment.course}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {formatDate(enrollment.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(enrollment._id)}
                      className="px-3 py-1 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition"
                      title="Delete enrollment"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentEnrolled;
