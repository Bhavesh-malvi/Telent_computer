import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaMoneyBillWave, FaEye, FaEllipsisV, FaFileExcel } from 'react-icons/fa';
import { Users, Plus, Search } from 'react-feather';

const ALL_FIELDS = [
  { key: 'formNo', label: 'Form No' },
  { key: 'name', label: 'Name' },
  { key: 'dob', label: 'DOB' },
  { key: 'course', label: 'Course' },
  { key: 'schoolCollegeName', label: 'School/College' },
  { key: 'address', label: 'Address' },
  { key: 'contactNo', label: 'Contact No' },
  { key: 'fatherName', label: 'Father Name' },
  { key: 'motherName', label: 'Mother Name' },
  { key: 'email', label: 'Email' },
  { key: 'city', label: 'City' },
  { key: 'pinCode', label: 'Pin Code' },
  { key: 'totalFees', label: 'Total Fees' },
  { key: 'totalDue', label: 'Total Due' },
  { key: 'courseStatus', label: 'Course Status' },
];

const StudentList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [schoolFilter, setSchoolFilter] = useState('All');
  const [excelDialog, setExcelDialog] = useState(false);
  const [selectedFields, setSelectedFields] = useState(ALL_FIELDS.map(f => f.key));
  const studentsPerPage = 10;
  const downloadRef = useRef();
  const [courses, setCourses] = useState([]);
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
      // Sirf active students with Admission enquiryType dikhaye
      const activeStudents = response.data.filter(stu => 
        stu.status === 'active' && stu.enquiryType === 'Admission'
      );
      setStudents(activeStudents);
    } catch {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses to determine each student's course categories
  useEffect(() => {
    api.get('/studentcourses')
      .then(res => setCourses(res.data))
      .catch(() => setCourses([]));
  }, []);

  const courseIdToCategory = useMemo(() => {
    const map = {};
    for (const c of courses) {
      map[c._id] = (c.category || '').toLowerCase();
    }
    return map;
  }, [courses]);

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

  const handleFee = (student) => {
    navigate('/studentfee', { state: { studentId: student._id } });
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
      link.setAttribute('download', `students-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      link.click();
      setExcelDialog(false);
      toast.success('Excel report downloaded successfully!');
    } catch {
      toast.error('Excel export failed');
    }
  };


  // Calculate total due amount
  const calculateTotalDue = (student) => {
    if (!student.installments) return 0;
    return student.installments.reduce((total, installment) => {
      return total + (installment.paid ? 0 : installment.amount);
    }, 0);
  };

  // Get last payment info
  const getLastPaymentInfo = (student) => {
    if (!student.paymentHistory || student.paymentHistory.length === 0) {
      return null;
    }
    const sortedPayments = student.paymentHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    return {
      date: new Date(sortedPayments[0].date),
      amount: sortedPayments[0].amount
    };
  };

  // Get due status color
  const getDueStatusColor = (student) => {
    const totalDue = calculateTotalDue(student);
    if (totalDue === 0) return 'bg-transparent border-gray-200'; // No due amount

    const lastPaymentInfo = getLastPaymentInfo(student);
    if (!lastPaymentInfo) {
      // No payment history, check form registration date
      const formDate = student.date ? new Date(student.date) : new Date(student.createdAt);
      const monthsSinceRegistration = (new Date() - formDate) / (1000 * 60 * 60 * 24 * 30);
      
      if (monthsSinceRegistration >= 2) return 'bg-red-100 border-red-300 text-red-800';
      if (monthsSinceRegistration >= 1) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      return 'bg-transparent border-gray-200';
    }

    const monthsSinceLastPayment = (new Date() - lastPaymentInfo.date) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsSinceLastPayment >= 2) return 'bg-red-100 border-red-300 text-red-800';
    if (monthsSinceLastPayment >= 1) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    return 'bg-transparent border-gray-200';
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'No payment';
    return new Date(date).toLocaleDateString('en-IN');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Get unique school/college names for filter dropdown
  const uniqueSchools = useMemo(() => {
    const schools = new Set();
    students.forEach((student) => {
      if (student.schoolCollegeName && student.schoolCollegeName.trim()) {
        const schoolName = student.schoolCollegeName.trim();
        schools.add(schoolName);
      }
    });
    const schoolsArray = Array.from(schools).sort();
    return schoolsArray;
  }, [students]);

  // Filter students based on search, category, and school
  const filteredStudents = students.filter(student => {
    const matchesSearch = (
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.formNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.schoolCollegeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
    if (!matchesSearch) return false;
    
    // School filter check
    if (schoolFilter !== 'All') {
      const filterSchool = schoolFilter.trim();
      const studentSchool = (student.schoolCollegeName || '').trim();
      
      if (studentSchool !== filterSchool) {
        return false;
      }
    }
    // Combine UI category filter with role-based scopeCategory
    const scopeCategory = (localStorage.getItem('scopeCategory') || 'All').toLowerCase();
    const uiFilter = (categoryFilter || 'All').toLowerCase();
    let desired = 'all';
    if (scopeCategory === 'all' && uiFilter === 'all') desired = 'all';
    else if (scopeCategory === 'all') desired = uiFilter;
    else if (uiFilter === 'all') desired = scopeCategory;
    else if (scopeCategory === uiFilter) desired = scopeCategory; else desired = 'none';
    if (desired === 'all') return true;
    if (desired === 'none') return false;
    const selected = student.selectedCourses || [];
    return selected.some(c => {
      if (!c) return false;
      if (typeof c === 'object') {
        // Try direct category on object
        const directCat = (c.category || '').toLowerCase();
        if (directCat) return directCat === desired;
        // Fallback: lookup by _id from courses map
        const id = c._id || c.id;
        if (!id) return false;
        const mappedCat = (courseIdToCategory[id] || '').toLowerCase();
        return mappedCat === desired;
      }
      // Primitive ID string
      const id = c;
      const mappedCat = (courseIdToCategory[id] || '').toLowerCase();
      return mappedCat === desired;
    });
  });

  const totalPagesComputed = Math.max(1, Math.ceil(filteredStudents.length / studentsPerPage));

  // Sort by numeric Form No. ascending, then paginate
  const sortedStudents = useMemo(() => {
    const toNum = (val) => {
      if (!val) return Number.POSITIVE_INFINITY;
      const n = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
      return isNaN(n) ? Number.POSITIVE_INFINITY : n;
    };
    const arr = [...filteredStudents];
    arr.sort((a, b) => toNum(a.formNo) - toNum(b.formNo));
    return arr;
  }, [filteredStudents]);

  const getPaginatedStudents = () => {
    const startIndex = (currentPage - 1) * studentsPerPage;
    const endIndex = startIndex + studentsPerPage;
    return sortedStudents.slice(startIndex, endIndex);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50  p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white  rounded-lg shadow-lg overflow-hidden transition-colors duration-300">
      {/* Header */}
          <div className="bg-blue-600  px-6 py-4 transition-colors duration-300">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-white" />
                <h1 className="text-2xl font-bold text-white">Student Management</h1>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setExcelDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                <FaFileExcel className="w-4 h-4" />
                Get Report
              </button>
              {!isClerk && (
              <button 
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
              <Plus className="w-4 h-4" />
              Add Student
            </button>
              )}
            </div>
        </div>
      </div>

          {/* Search and Category Filter */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 md:items-center">
              <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, ID, email, or form number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              </div>
              {!(isClerk || isManager) && (
                <div>
                  <select
                    value={categoryFilter}
                    onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="All">All Categories</option>
                    <option value="Basic">Basic</option>
                    <option value="IT">IT</option>
                  </select>
                </div>
              )}
              <div>
                <select
                  value={schoolFilter}
                  onChange={e => { setSchoolFilter(e.target.value); setCurrentPage(1); }}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="All">All Schools/Colleges</option>
                  {uniqueSchools.map(school => (
                    <option key={school} value={school}>{school}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Student List */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Form No.
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Fee
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Due
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Payment
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getPaginatedStudents().map((student) => {
                  const totalDue = calculateTotalDue(student);
                  const lastPaymentInfo = getLastPaymentInfo(student);
                  const dueStatusColor = getDueStatusColor(student);

                  return (
                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                      {/* Form No. */}
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.formNo || 'N/A'}
                      </td>

                      {/* Student Info */}
                      <td className="px-6 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {student.image ? (
                              <img 
                                className="h-12 w-12 rounded-full object-cover border-2 border-gray-200" 
                                src={student.image} 
                                alt={student.name}
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/48x48?text=' + student.name.charAt(0).toUpperCase();
                                }}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-lg">
                                  {student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">ID: {student.studentId}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                        {student.contactNo || 'N/A'}
                      </td>

                      {/* Email */}
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                        {student.email}
                      </td>

                      {/* Total Fee */}
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(student.totalFees || 0)}
                      </td>

                      {/* Total Due */}
                      <td className="px-6 py-2 whitespace-nowrap">
                        <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${dueStatusColor}`}>
                          {formatCurrency(totalDue)}
                        </div>
                      </td>

                      {/* Last Payment */}
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                        {lastPaymentInfo ? (
                          <div>
                            <div className="font-medium">{formatDate(lastPaymentInfo.date)}</div>
                            <div className="text-xs text-gray-500">{formatCurrency(lastPaymentInfo.amount)}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No payment</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const menu = document.getElementById(`menu-${student._id}`);
                              // Close all other menus first
                              document.querySelectorAll('[id^="menu-"]').forEach(m => {
                                if (m.id !== `menu-${student._id}`) {
                                  m.classList.add('hidden');
                                }
                              });
                              menu.classList.toggle('hidden');
                              
                              // Position the menu properly with smart positioning
                              if (!menu.classList.contains('hidden')) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const menuHeight = 200; // Approximate menu height
                                const windowHeight = window.innerHeight;
                                const spaceBelow = windowHeight - rect.bottom;
                                const spaceAbove = rect.top;
                                
                                                                 // Check if there's enough space below, if not, position above but closer
                                 if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
                                   // Position above the button but closer (reduce gap)
                                   menu.style.top = `${rect.top - menuHeight - 2}px`;
                                 } else {
                                   // Position below the button (default)
                                   menu.style.top = `${rect.bottom + 2}px`;
                                 }
                                
                                // Horizontal positioning - ensure it doesn't go off-screen
                                const menuWidth = 192; // w-48 = 192px
                                const spaceRight = window.innerWidth - rect.right;
                                
                                if (spaceRight < menuWidth) {
                                  // Position to the left of the button
                                  menu.style.left = `${rect.left - menuWidth + 40}px`; // 40px for button width
                                } else {
                                  // Position to the right of the button (default)
                                  menu.style.left = `${rect.right - menuWidth}px`;
                                }
                                
                                // Highlight the row
                                const row = e.currentTarget.closest('tr');
                                if (row) {
                                  row.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
                                  row.style.borderLeft = '3px solid #3b82f6';
                                }
                              } else {
                                // Remove highlight when closing menu
                                const row = e.currentTarget.closest('tr');
                                if (row) {
                                  row.style.backgroundColor = '';
                                  row.style.borderLeft = '';
                                }
                              }
                            }}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none p-2 rounded hover:bg-gray-100"
                          >
                            <FaEllipsisV />
                          </button>
                          
                          {/* Dropdown Menu */}
                          <div
                            id={`menu-${student._id}`}
                            className="hidden w-48 bg-white rounded-lg shadow-2xl border border-gray-200"
                            style={{ 
                              position: 'fixed',
                              zIndex: 9999,
                              backdropFilter: 'blur(10px)',
                               backgroundColor: 'rgba(255, 255, 255, 0.95)',
                               boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                            }}
                          >
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  handleView(student);
                                  document.getElementById(`menu-${student._id}`).classList.add('hidden');
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <FaEye className="mr-3" />
                                View Details
                              </button>
                              {!isClerk && (
                              <button
                                onClick={() => {
                                  handleEdit(student);
                                  document.getElementById(`menu-${student._id}`).classList.add('hidden');
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <FaEdit className="mr-3" />
                                Edit
                              </button>
                              )}
                              {!isClerk && (
                              <button
                                onClick={() => {
                                  handleFee(student);
                                  document.getElementById(`menu-${student._id}`).classList.add('hidden');
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <FaMoneyBillWave className="mr-3" />
                                Fee Details
                              </button>
                              )}
                              {canDelete && <hr className="my-1" />}
                               {canDelete && (
                              <button
                                onClick={() => {
                                  handleDelete(student._id);
                                  document.getElementById(`menu-${student._id}`).classList.add('hidden');
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <FaTrash className="mr-3" />
                                Delete
                              </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPagesComputed > 1 && (
            <div className="bg-white px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * studentsPerPage) + 1} to {Math.min(currentPage * studentsPerPage, filteredStudents.length)} of {filteredStudents.length} students
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPagesComputed }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesComputed))}
                    disabled={currentPage === totalPagesComputed}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* No students found */}
          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Excel Dialog */}
      {excelDialog && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, minWidth: 500, maxWidth: 600, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>Select Fields for Excel Report</h3>
              <button 
                onClick={() => setExcelDialog(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '24px', 
                  cursor: 'pointer', 
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {ALL_FIELDS.map(f => (
                  <div key={f.key} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '12px', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    backgroundColor: selectedFields.includes(f.key) ? '#f3f4f6' : '#fff',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(f.key)}
                      onChange={e => {
                        if (e.target.checked) setSelectedFields([...selectedFields, f.key]);
                        else setSelectedFields(selectedFields.filter(k => k !== f.key));
                      }}
                      style={{ marginRight: '12px', transform: 'scale(1.2)' }}
                    />
                    <label style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151',
                      cursor: 'pointer',
                      flex: 1
                    }}>
                      {f.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                {selectedFields.length} of {ALL_FIELDS.length} fields selected
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setExcelDialog(false)} 
                  style={{ 
                    padding: '10px 20px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px', 
                    background: '#fff', 
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleExcelExport} 
                  disabled={selectedFields.length === 0}
                  style={{ 
                    padding: '10px 20px', 
                    border: 'none', 
                    borderRadius: '6px', 
                    background: selectedFields.length === 0 ? '#9ca3af' : '#2563eb', 
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: selectedFields.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Get Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <a ref={downloadRef} style={{ display: 'none' }}>Download</a>

      {/* Close dropdown when clicking outside */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('click', function(event) {
            const dropdowns = document.querySelectorAll('[id^="menu-"]');
            dropdowns.forEach(dropdown => {
              if (!dropdown.contains(event.target) && !event.target.closest('button')) {
                dropdown.classList.add('hidden');
                // Remove row highlighting when closing menu
                const rows = document.querySelectorAll('tr');
                rows.forEach(row => {
                  row.style.backgroundColor = '';
                  row.style.borderLeft = '';
                });
              }
            });
          });
        `
      }} />
    </div>
  );
};

export default StudentList;