import React, { useEffect, useState, useRef } from 'react';
import axios from '../services/api';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaEye, FaEllipsisV, FaFileExcel, FaCertificate } from 'react-icons/fa';
import { Users, Search } from 'react-feather';

const currentYear = new Date().getFullYear();
const getYearOptions = (start = 2020) => {
  const years = [];
  for (let y = currentYear; y >= start; y--) years.push(y);
  return years;
};

const ALL_FIELDS = [
  { key: 'formNo', label: 'Form No' },
  { key: 'name', label: 'Name' },
  { key: 'dob', label: 'DOB' },
  { key: 'course', label: 'Course' },
  { key: 'address', label: 'Address' },
  { key: 'contactNo', label: 'Contact No' },
  { key: 'fatherName', label: 'Father Name' },
  { key: 'motherName', label: 'Mother Name' },
  { key: 'email', label: 'Email' },
  { key: 'city', label: 'City' },
  { key: 'pinCode', label: 'Pin Code' },
];

const ExStudentList = () => {
  const [year, setYear] = useState(currentYear);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [excelDialog, setExcelDialog] = useState(false);
  const [selectedFields, setSelectedFields] = useState(ALL_FIELDS.map(f => f.key));
  const [viewDialog, setViewDialog] = useState(null);
  const [editDialog, setEditDialog] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [certDialog, setCertDialog] = useState(null);
  const [certError, setCertError] = useState("");
  const [yearOptions, setYearOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const downloadRef = useRef();
  const roleLower = (localStorage.getItem('role') || '').toLowerCase();
  const isClerk = roleLower.includes('clerk');
  const isManager = roleLower.includes('manager');

  // Fetch year options on mount
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await axios.get('/students/ex-students/years');
        setYearOptions(res.data);
        if (res.data.length > 0) setYear(res.data[0]);
      } catch {}
    };
    fetchYears();
  }, []);

  // Fetch students when year changes
  useEffect(() => {
    if (year) fetchExStudents(year);
  }, [year]);

  const fetchExStudents = async (yr) => {
    setLoading(true);
    try {
      const res = await axios.get(`/students/ex-students?year=${yr}`);
      setStudents(res.data);
    } catch {
      setStudents([]);
    }
    setLoading(false);
  };

  const handleExcelExport = async () => {
    if (!selectedFields.length) return;
    if (filteredStudents.length === 0) {
      toast.error('No ex-students found to export!');
      return;
    }
    try {
      const res = await axios.post(
        '/students/ex-students/export',
        { year, fields: selectedFields },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = downloadRef.current;
      link.href = url;
      link.setAttribute('download', `ex-students-${year}.xlsx`);
      link.click();
      setExcelDialog(false);
    } catch {
      alert('Excel export failed');
    }
  };

  // Dummy: check if all installments paid
  const isFeesClear = (stu) => {
    if (!stu.installments) return false;
    return stu.installments.every(inst => inst.paid);
  };

  const handleEditStatus = async (stu) => {
    try {
      await axios.put(`/students/${stu._id}`, { courseStatus: 'active' });
      toast.success('Student status updated to Active');
      setEditDialog(null);
      fetchExStudents(year);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (stu) => {
    try {
      await axios.delete(`/students/${stu._id}`);
      toast.success('Student deleted');
      setDeleteDialog(null);
      fetchExStudents(year);
    } catch {
      toast.error('Failed to delete student');
    }
  };

  const handleCertificate = (stu) => {
    if (!isFeesClear(stu)) {
      setCertError('Certificate cannot be generated. The student\'s fees are still pending.');
      setCertDialog(stu);
      return;
    }
    setCertError("");
    setCertDialog(stu);
  };

  // Filter students based on search
  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.formNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN');
  };

  // Safely read value and stringify if needed
  const safe = (v) => (v === null || v === undefined ? '' : String(v));

  const getCourseNames = (stu) => {
    try {
      if (!stu || !stu.selectedCourses) return '';
      if (Array.isArray(stu.selectedCourses)) {
        return stu.selectedCourses.map(c => c?.name || '').filter(Boolean).join(', ');
      }
      return '';
    } catch {
      return '';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ex-students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-white" />
                <h1 className="text-2xl font-bold text-white">Ex-Student Management</h1>
              </div>
              <button 
                onClick={() => setExcelDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                <FaFileExcel className="w-4 h-4" />
                Get Excel Report
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, ID, email, or form number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={year || ''}
                onChange={e => setYear(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {yearOptions.length === 0 && <option value="">No years</option>}
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Student List */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Form No.
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed Year
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No ex-students found for {year}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                      {/* Form No. */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.formNo || 'N/A'}
                      </td>

                      {/* Student Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.contactNo || 'N/A'}
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.email}
                      </td>

                      {/* Course */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.selectedCourses && student.selectedCourses.length > 0 
                          ? student.selectedCourses[0].name 
                          : 'N/A'}
                      </td>

                      {/* Completed Year */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.completedYear || 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                              
                              // Position the menu properly
                              if (!menu.classList.contains('hidden')) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                menu.style.top = `${rect.bottom + 5}px`;
                                menu.style.left = `${rect.right - 192}px`;
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
                              maxHeight: '200px',
                              overflowY: 'auto',
                              backdropFilter: 'blur(10px)',
                              backgroundColor: 'rgba(255, 255, 255, 0.95)'
                            }}
                          >
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setViewDialog(student);
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
                                    setEditDialog(student);
                                    document.getElementById(`menu-${student._id}`).classList.add('hidden');
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <FaEdit className="mr-3" />
                                  Mark as Active
                                </button>
                              )}
                              {!isClerk && (
                                <button
                                  onClick={() => {
                                    handleCertificate(student);
                                    document.getElementById(`menu-${student._id}`).classList.add('hidden');
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <FaCertificate className="mr-3" />
                                  Generate Certificate
                                </button>
                              )}
                              {!isClerk && !isManager && <hr className="my-1" />}
                              {!isClerk && !isManager && (
                                <button
                                  onClick={() => {
                                    setDeleteDialog(student);
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* No students found */}
          {filteredStudents.length === 0 && students.length > 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No ex-students found</h3>
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

      {/* View Dialog */}
      {viewDialog && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 10, width: 'min(960px, 92vw)', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Student Details</h3>
              <button onClick={() => setViewDialog(null)} style={{ border: '1px solid #e5e7eb', background: '#fff', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>Close</button>
            </div>

            {/* Basic Information */}
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '8px 0' }}>Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Form No</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.formNo)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Student ID</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.studentId)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Registration Date</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(formatDate(viewDialog.date))} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Course Status</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.courseStatus)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.status)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Completed Year</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.completedYear)} />
              </div>
            </div>

            {/* Personal Information */}
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '16px 0 8px' }}>Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.name)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Surname</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.surname)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Father/Husband Name</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.fatherHusbandName)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">DOB</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(formatDate(viewDialog.dob))} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Gender</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.gender)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Education Level</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.educationLevel)} />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm text-gray-600 mb-1">Aadhar</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.aadhar)} />
              </div>
            </div>

            {/* Contact Information */}
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '16px 0 8px' }}>Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Contact No</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.contactNo)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Father No</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.fatherNo)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Home Contact</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.homeContact)} />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.email)} />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm text-gray-600 mb-1">Address</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.address)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Area</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.area)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">City</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.city)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Pin Code</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.pinCode)} />
              </div>
            </div>

            {/* Course & Fee Information */}
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '16px 0 8px' }}>Course & Fee Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm text-gray-600 mb-1">Selected Courses</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={getCourseNames(viewDialog)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Discount</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.discount)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Total Fees</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.totalFees)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Total Due</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.totalDue)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Installments Count</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.installments?.length || 0)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Paid Installments</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe((viewDialog.installments || []).filter(i => i.paid).length)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Reference</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.reference)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Inquiry By</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.inquiryBy)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Inquiry Date</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.inquiryDate)} />
              </div>
            </div>

            {/* Payment History (summary) */}
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '16px 0 8px' }}>Payment History</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Payments Count</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(viewDialog.paymentHistory?.length || 0)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Last Payment Date</label>
                <input readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50" value={safe(formatDate((viewDialog.paymentHistory || []).slice().sort((a,b)=> new Date(b.date)-new Date(a.date))[0]?.date))} />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editDialog && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 320 }}>
            <h3>Mark as Active?</h3>
            <p>Is student ko wapas Active banana hai?</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={() => setEditDialog(null)}>Cancel</button>
              <button onClick={() => handleEditStatus(editDialog)} style={{ background: '#1976d2', color: '#fff', padding: '6px 18px', border: 'none', borderRadius: 4 }}>Yes, Mark Active</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteDialog && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 320 }}>
            <h3>Delete Student?</h3>
            <p>Are you sure you want to delete this student?</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={() => setDeleteDialog(null)}>Cancel</button>
              <button onClick={() => handleDelete(deleteDialog)} style={{ background: '#d32f2f', color: '#fff', padding: '6px 18px', border: 'none', borderRadius: 4 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Dialog */}
      {certDialog && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 320 }}>
            <h3>Certificate</h3>
            {certError ? (
              <div style={{ color: 'red', marginBottom: 12 }}>{certError}</div>
            ) : (
              <div>Certificate preview (TODO)</div>
            )}
            <button onClick={() => setCertDialog(null)} style={{ marginTop: 16 }}>Close</button>
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
              }
            });
          });
        `
      }} />
    </div>
  );
};

export default ExStudentList; 