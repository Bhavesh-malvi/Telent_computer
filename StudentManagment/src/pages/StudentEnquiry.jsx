import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaEye, FaEllipsisV, FaFileExcel, FaTimes } from 'react-icons/fa';
import { Users, Plus, Search } from 'react-feather';

const ALL_FIELDS = [
  { key: 'formNo', label: 'Form No' },
  { key: 'name', label: 'Name' },
  { key: 'dob', label: 'DOB' },
  { key: 'schoolCollegeName', label: 'School/College' },
  { key: 'address', label: 'Address' },
  { key: 'contactNo', label: 'Contact No' },
  { key: 'fatherName', label: 'Father Name' },
  { key: 'motherName', label: 'Mother Name' },
  { key: 'email', label: 'Email' },
  { key: 'city', label: 'City' },
  { key: 'pinCode', label: 'Pin Code' },
  { key: 'inquiryDate', label: 'Inquiry Date' },
  { key: 'inquiryBy', label: 'Inquiry By' },
  { key: 'reference', label: 'Reference' },
  { key: 'courseStatus', label: 'Course Status' },
];

const StudentEnquiry = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [excelDialog, setExcelDialog] = useState(false);
  const [selectedFields, setSelectedFields] = useState(ALL_FIELDS.map(f => f.key));
  const studentsPerPage = 10;
  const downloadRef = useRef();
  // Role-based UI flags
  const roleLower = (localStorage.getItem('role') || '').toLowerCase();
  const isClerk = roleLower.includes('clerk');
  const isManager = roleLower.includes('manager');
  const canDelete = !(isClerk || isManager);

  useEffect(() => {
    fetchStudents();
  }, [currentPage]);

  // Refresh data when page comes into focus (after edit)
  useEffect(() => {
    const handleFocus = () => {
      fetchStudents();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Also refresh when location changes (back from edit page)
  useEffect(() => {
    fetchStudents();
  }, [location.pathname]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/students');
      // Sirf active students with Enquiry enquiryType dikhaye
      const activeStudents = response.data.filter(stu => 
        stu.status === 'active' && stu.enquiryType === 'Enquiry'
      );
      setStudents(activeStudents);
    } catch {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };



  const handleDelete = async (id) => {
    try {
      // Disallow delete for Managers and Clerks
      const role = (localStorage.getItem('role') || '').toLowerCase();
      if (role.includes('manager') || role.includes('clerk')) {
        toast.error('You do not have permission to delete');
        return;
      }
      await api.delete(`/students/${id}`);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch {
      toast.error('Failed to delete student');
    }
  };

  const handleEdit = (student) => {
    navigate('/register', { state: { student } });
  };

  const handleView = (student) => {
    navigate('/register', { state: { studentId: student._id, readOnly: true } });
  };



  const handleExcelExport = async () => {
    if (!selectedFields.length) return;
    if (filteredStudents.length === 0) {
      toast.error('No students found to export!');
      return;
    }
    try {
      // Send filtered student IDs to backend for targeted export
      const studentIds = filteredStudents.map(student => student._id);
      const res = await api.post(
        '/students/export-filtered',
        { 
          fields: selectedFields,
          studentIds: studentIds 
        },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = downloadRef.current;
      link.href = url;
      link.setAttribute('download', `student-enquiries-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      link.click();
      setExcelDialog(false);
      toast.success('Excel report downloaded successfully!');
    } catch {
      toast.error('Excel export failed');
    }
  };



  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student =>
        student.name?.toLowerCase().includes(term) ||
        student.studentId?.toLowerCase().includes(term) ||
        student.contactNo?.includes(term) ||
        student.email?.toLowerCase().includes(term) ||
        student.formNo?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [students, searchTerm]);



  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Enquiries</h1>
            <p className="text-gray-600 mt-1">Manage student enquiries and convert them to admissions</p>
            <div className="mt-2 flex items-center gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 shadow-sm">
                <span className="text-sm text-gray-700">
                  📊 Total Enquiries: <span className="font-bold text-blue-700 text-lg">{students.length}</span>
                </span>
              </div>
              {searchTerm && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 shadow-sm">
                  <span className="text-sm text-gray-700">
                    🔍 Filtered Results: <span className="font-bold text-green-700 text-lg">{filteredStudents.length}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setExcelDialog(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaFileExcel className="text-sm" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => navigate('/register')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="text-sm" />
              <span>Add New Enquiry</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name, ID, contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear search"
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading students...</p>
            </div>
          ) : currentStudents.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No enquiries found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? 'Try adjusting your search.'
                  : 'Get started by creating a new student enquiry.'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/register')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Add New Enquiry
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inquiry Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inquiry By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentStudents.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {student.image ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={student.image}
                                  alt={student.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    {student.name?.charAt(0)?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student.name} {student.surname}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {student.studentId || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                Form: {student.formNo || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{student.contactNo || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{student.email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {student.inquiryDate ? new Date(student.inquiryDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {student.inquiryBy || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {student.reference || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            student.courseStatus === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : student.courseStatus === 'in-progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {student.courseStatus || 'pending'}
                          </span>
                        </td>
                                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleView(student)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => handleEdit(student)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(student._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{indexOfFirstStudent + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(indexOfLastStudent, filteredStudents.length)}
                        </span>{' '}
                        of <span className="font-medium">{filteredStudents.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => paginate(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Excel Export Dialog */}
      {excelDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 border w-full max-w-md mx-auto bg-white rounded-lg shadow-xl">
            <div className="text-center">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">Export to Excel</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Fields to Export</label>
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {ALL_FIELDS.map(field => (
                      <label key={field.key} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(field.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFields([...selectedFields, field.key]);
                            } else {
                              setSelectedFields(selectedFields.filter(f => f !== field.key));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setExcelDialog(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExcelExport}
                  disabled={selectedFields.length === 0}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden download link for Excel */}
      <a ref={downloadRef} style={{ display: 'none' }} />
    </div>
  );
};

export default StudentEnquiry;
