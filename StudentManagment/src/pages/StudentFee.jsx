import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { payStudentFee } from "../services/api";
import "../styles/StudentFee.css";
import { CreditCard, CheckCircle, AlertCircle, TrendingUp, User, Mail, DollarSign, Calendar, FileText, Printer, XCircle, Trash2, Edit, Loader } from "react-feather";
import { toast } from "react-toastify";
import Select from 'react-select';

// PaymentReceipt component (move outside StudentFee)
const PaymentReceipt = React.forwardRef(({ student, payment, installmentNumber, courseNames, totalDue }, ref) => (
  <div id="receipt-content" ref={ref} className="receipt-card">
    <div className="receipt-header">
      <h2>Talent Computer Institute</h2>
    </div>
    <hr />
    <div className="receipt-body">
      <p><b>Receipt ID:</b> {payment._id}</p>
      <p><b>Payment Date:</b> {(() => {
        try {
          // Handle both date string and Date object
          if (typeof payment.date === 'string') {
            // If it's already a date string (YYYY-MM-DD), format it
            const [year, month, day] = payment.date.split('-');
            if (year && month && day) {
              const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              return dateObj.toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
              });
            }
          }
          // If it's a Date object or fallback
          const date = new Date(payment.date);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-IN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric'
            });
          }
          // Fallback to original date if parsing fails
          return payment.date;
        } catch {
          // Fallback to original date if any error
          return payment.date;
        }
      })()}</p>
      <p><b>Collected By:</b> {payment.paidBy || 'N/A'}</p>
      <p><b>Student Name:</b> {student.name} {student.surname || ''}</p>
      <p><b>Father's Name:</b> {student.fatherName || 'N/A'}</p>
      <p><b>Mother's Name:</b> {student.motherName || 'N/A'}</p>
      {courseNames && courseNames.length > 0 && (
        <p><b>Course(s):</b> {courseNames.join(", ")}</p>
      )}
      <p><b>Installment Number:</b> {installmentNumber || "N/A"}</p>
      <p><b>Amount Paid:</b> ₹{payment.amount}</p>
      <p><b>Total Due:</b> ₹{totalDue.toLocaleString()}</p>
    </div>
    <hr />
    <div className="receipt-footer">
      <p>Thank you for your payment!</p>
    </div>
  </div>
));

const StudentFee = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialStudentId = location.state?.studentId;
  const fromSidebar = Boolean(location.state?.fromSidebar);
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId || "");
  const [allStudents, setAllStudents] = useState([]);
  const studentOptions = useMemo(() => {
    return (allStudents || []).map(s => ({
      value: s._id,
      label: `${s.name} (${s.studentId}) — Father: ${s.fatherName || 'N/A'} | Mother: ${s.motherName || 'N/A'}`
    }));
  }, [allStudents]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [installments, setInstallments] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [utrNumber, setUtrNumber] = useState('');
  const [collectedBy, setCollectedBy] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [staffList, setStaffList] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const receiptRef = useRef(null);
  const [printMeta, setPrintMeta] = useState({ generatedBy: '', printedAt: '' });

  const getCurrentUserInfo = () => {
    const roleRaw = (localStorage.getItem('role') || '').trim();
    let username = localStorage.getItem('username') || localStorage.getItem('name') || localStorage.getItem('staffName') || '';
    const userJson = localStorage.getItem('user');
    if (!username && userJson) {
      try {
        const u = JSON.parse(userJson);
        username = u?.username || u?.name || [u?.firstName, u?.lastName].filter(Boolean).join(' ') || '';
      } catch (_) {}
    }
    const roleLower = roleRaw.toLowerCase();
    const generatedBy = (roleLower.includes('super') || roleLower.includes('admin'))
      ? 'SuperAdmin'
      : (username || 'Staff');
    return { generatedBy };
  };

  // Add cheque fields state
  const [chequeDetails, setChequeDetails] = useState({
    chequeNumber: '',
    bankName: '',
    chequeDate: '',
    accountHolderName: '',
    branchName: '',
    status: 'Pending',
  });
  const [showChequeModal, setShowChequeModal] = useState(false);
  const [selectedChequeDetails, setSelectedChequeDetails] = useState(null);

  // Add state for editing cheque status
  const [editChequeModal, setEditChequeModal] = useState(false);
  const [editChequePaymentIdx, setEditChequePaymentIdx] = useState(null);
  
  // Loading state for delete payment
  const [deletingPayment, setDeletingPayment] = useState(null);
  const [editChequeStatus, setEditChequeStatus] = useState('Pending');
  const [feeDetails, setFeeDetails] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Load active students for quick switching
  useEffect(() => {
    api.get('/students')
      .then(res => {
        // Only show students with Admission enquiryType (not Enquiry)
        const active = (res.data || []).filter(stu => 
          stu.status === 'active' && stu.enquiryType === 'Admission'
        );
        // Sort by name then studentId for easier lookup
        active.sort((a, b) => (a.name || '').localeCompare(b.name || '') || (a.studentId || '').localeCompare(b.studentId || ''));
        setAllStudents(active);
        // If coming from sidebar, do NOT preselect; show only search bar until a student is chosen
        if (fromSidebar) {
          setSelectedStudentId('');
          return;
        }
        // If no initial selection, preselect first student (direct route or refresh)
        if (!initialStudentId && active.length > 0) {
          setSelectedStudentId(active[0]._id);
        }
        // If navigated to /studentfee directly with no state, still auto-select first
        if (!fromSidebar && !selectedStudentId && active.length > 0) {
          setSelectedStudentId(active[0]._id);
        }
      })
      .catch(() => setAllStudents([]));
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      // From sidebar: show selector only without error
      if (fromSidebar) {
        setError("");
        setLoading(false);
        return;
      }
      setError("No student selected");
      setLoading(false);
      return;
    }
    fetchStudentData(selectedStudentId);
  }, [selectedStudentId]);

  useEffect(() => {
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    try {
      const response = await api.get('/staff');
      // Filter out SuperAdmin from staff list (since we add it manually)
      const filteredStaff = (response.data || []).filter(staff => staff.role !== 'SuperAdmin');
      setStaffList(filteredStaff);
    } catch (err) {
      console.error("Failed to fetch staff list:", err);
    }
  };

  const fetchStudentData = async (idParam) => {
    try {
      setLoading(true);
      const studentIdToFetch = idParam || selectedStudentId;
      const response = await api.get(`/students/${studentIdToFetch}`);
      setStudent(response.data);
      setInstallments(response.data.installments || []);
      
      // Fetch fee details from backend
      try {
        const feeResponse = await api.get(`/students/${studentIdToFetch}/fee-details`);
        setFeeDetails(feeResponse.data);
      } catch (feeError) {
        console.error('Error fetching fee details:', feeError);
      }
      
      setError('');
    } catch (err) {
      setError("Failed to fetch student data");
      console.error('Error fetching student:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update handlePayFee to send chequeDetails if paymentMethod is Cheque
  const handlePayFee = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) return;
    
    // Check if payment amount exceeds total due
    const paymentAmount = parseFloat(payAmount);
    if (paymentAmount > totalDue) {
      toast.error(`Payment amount (₹${paymentAmount.toLocaleString()}) cannot exceed total due (₹${totalDue.toLocaleString()})`);
      return;
    }
    
    // Validate required fields
    if (!collectedBy.trim()) {
      toast.error('Please select who collected the payment');
      return;
    }
    
    if (!paymentDate) {
      toast.error('Please select payment date');
      return;
    }
    
    if (paymentMethod === 'Online' && !utrNumber.trim()) return;
    if (paymentMethod === 'Cheque') {
      if (!chequeDetails.chequeNumber || !chequeDetails.bankName || !chequeDetails.chequeDate || !chequeDetails.accountHolderName) {
        toast.error('Please fill all cheque details');
        return;
      }
    }
    
    setPaymentLoading(true);
    try {
      // Use selected collectedBy instead of current user
      const res = await payStudentFee(selectedStudentId, payAmount, paymentMethod, utrNumber, chequeDetails, collectedBy, paymentDate);
      if (res && res.data) {
        if (res.data.installments && res.data.paymentHistory) {
          setInstallments(res.data.installments);
          setStudent(res.data); // update student state for real-time payment history
        } else {
          fetchStudentData();
        }
      } else {
        await fetchStudentData(selectedStudentId);
      }
      setPayAmount('');
      setUtrNumber('');
      setPaymentMethod('Cash');
      setCollectedBy('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setChequeDetails({
        chequeNumber: '',
        bankName: '',
        chequeDate: '',
        accountHolderName: '',
        branchName: '',
        status: 'Pending',
      });
      toast.success('Payment successful!');
    } catch (err) {
      console.error("Payment API error:", err);
      setError('Payment failed. Please try again.');
      toast.error('Payment failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    setDeletingPayment(paymentId);
    try {
      const role = (localStorage.getItem('role') || '').toLowerCase();
      const isClerk = role.includes('clerk');
      if (isClerk) {
        setError('You do not have permission to delete payments');
        return;
      }
      const res = await api.delete(`/students/${selectedStudentId}/payment/${paymentId}`);
      setStudent(res.data);
      setInstallments(res.data.installments || []);
      setError('');
      toast.success('Payment deleted successfully!');
    } catch (err) {
      setError("Failed to delete payment. Please try again.");
      console.error('Delete payment error:', err);
      toast.error('Failed to delete payment');
    } finally {
      setDeletingPayment(null);
    }
  };

  const handlePrintReceipt = (payment) => {
    setReceiptData(payment);
    setShowReceipt(true);
    // Use the current user who is printing the receipt
    const currentUser = getCurrentUserInfo().generatedBy;
    
    // Use current time when print button is clicked (with time for Created At)
    const currentTime = new Date().toLocaleString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    setPrintMeta({ generatedBy: currentUser, printedAt: currentTime });
    // Scroll to receipt for visual feedback
    setTimeout(() => {
      try { receiptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) {}
    }, 0);
  };

  const handlePrint = async () => {
    // Update printedAt to the moment of printing with proper format (with time for Created At)
    const currentTime = new Date().toLocaleString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    setPrintMeta(prev => ({ ...prev, printedAt: currentTime }));
    
    // Ensure images/fonts are ready before printing
    const root = receiptRef.current || document;
    const imgs = Array.from(root.querySelectorAll('img'));
    const decodePromises = imgs.map(img => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()));
    const timeout = new Promise(resolve => setTimeout(resolve, 300));
    await Promise.race([Promise.all(decodePromises), timeout]);
    
    // Store current receipt data for reset
    const currentReceiptData = receiptData;
    const currentShowReceipt = showReceipt;
    
    // Print the document
    window.print();
    
    // Reset state after a short delay to allow print dialog to close
    setTimeout(() => {
      if (showReceipt === currentShowReceipt && receiptData === currentReceiptData) {
        setShowReceipt(false);
        setReceiptData(null);
        setPrintMeta({ generatedBy: '', printedAt: '' });
      }
    }, 1000);
  };

  // Auto-open print dialog when receipt becomes visible
  useEffect(() => {
    if (showReceipt && receiptData) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showReceipt, receiptData]);

  // Handle print dialog close event
  useEffect(() => {
    const handleAfterPrint = () => {
      // Reset receipt state when print dialog closes
      setShowReceipt(false);
      setReceiptData(null);
      setPrintMeta({ generatedBy: '', printedAt: '' });
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // Function to open edit modal
  const handleEditCheque = (idx, currentStatus) => {
    setEditChequePaymentIdx(idx);
    setEditChequeStatus(currentStatus || 'Pending');
    setEditChequeModal(true);
  };

  // Function to update cheque status
  const handleUpdateChequeStatus = async () => {
    if (editChequePaymentIdx === null) return;
    const payment = student.paymentHistory[editChequePaymentIdx];
    try {
      await api.patch(`/students/${student._id}/payment/${payment._id}/cheque-status`, { status: editChequeStatus });
      await fetchStudentData();
      setEditChequeModal(false);
    } catch {
      alert('Failed to update cheque status');
    }
  };

  // Calculate stats
  const totalPaid = (student?.paymentHistory || [])
    .filter(p => p && typeof p.amount === 'number' && !isNaN(p.amount))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Calculate actual due based on unpaid installments
  const actualDue = (installments || [])
    .filter(inst => inst && !inst.paid)
    .reduce((sum, inst) => sum + (inst.amount || 0), 0);

  // Use actual due (unpaid installments) instead of totalFees
  const totalDue = actualDue;

  const paidInstallments = (installments || []).filter(inst => inst && inst.paid).length;
  const totalInstallments = (installments || []).length;
  const paymentProgressRaw = totalInstallments > 0 ? (paidInstallments / totalInstallments * 100) : 0;
  const paymentProgress = Number(paymentProgressRaw);

  // Calculate original fee from selectedCourses with fallback
  const originalFee = Array.isArray(student?.selectedCourses) && student.selectedCourses.length > 0
    ? student.selectedCourses.reduce((sum, c) => sum + (c?.fees || 0), 0)
    : (student?.totalFees || 0); // Fallback to totalFees if selectedCourses is missing
    

  
  let discountAmount = 0;
  let discountPercent = 0;
  if (student?.discount) {
    if (student.discount <= 100) {
      discountPercent = student.discount;
      discountAmount = Math.round(originalFee * (student.discount / 100));
    } else {
      discountAmount = student.discount;
      discountPercent = originalFee > 0 ? (student.discount / originalFee) * 100 : 0;
    }
  }

  const showOnlySearch = fromSidebar && !selectedStudentId;

  if (loading && !showOnlySearch) {
    return (
      <div className="student-fee-container">
        <div className="student-loading">
          <div className="loading-spinner"></div>
          <p>Loading student fee data...</p>
        </div>
      </div>
    );
  }

  if (error && !student && !showOnlySearch) {
    return (
      <div className="student-fee-container">
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => navigate('/students')} className="retry-button">
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  if (!student && !showOnlySearch) return null;


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
          </div>
          <p className="text-gray-600 mt-2">Manage student fees and payments</p>
          {/* Student Quick Selector */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
              <Select
                inputId="student-selector"
                classNamePrefix="student-select"
                placeholder={allStudents.length === 0 ? 'Loading students...' : 'Search and select student...'}
                value={studentOptions.find(o => o.value === selectedStudentId) || null}
                onChange={(opt) => {
                  const newId = opt ? opt.value : '';
                  setSelectedStudentId(newId);
                  // reset payment UI for new student
                  setPayAmount('');
                  setPaymentMethod('Cash');
                  setUtrNumber('');
                  setChequeDetails({ chequeNumber: '', bankName: '', chequeDate: '', accountHolderName: '', branchName: '', status: 'Pending' });
                  setShowReceipt(false);
                  setReceiptData(null);
                }}
                options={studentOptions}
                isClearable
                isSearchable
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: '42px',
                    borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
                    boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : 'none',
                    '&:hover': { borderColor: '#2563eb' },
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 50,
                  }),
                }}
              />
            </div>
          </div>
        </div>

        {showOnlySearch && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <p className="text-gray-600">Please select a student from the search above to view fee details.</p>
          </div>
        )}
        {/* Fee Overview Cards */}
        {!showOnlySearch && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Paid Fee */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid Fee</p>
                <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          {/* Total Due */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Due</p>
                <p className="text-2xl font-bold text-red-600">₹{totalDue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          {/* Payment Progress */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Progress</p>
                <p className="text-2xl font-bold text-blue-600">{isNaN(paymentProgress) ? 0 : paymentProgress.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${isNaN(paymentProgress) ? 0 : paymentProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
        )}
        {/* Student Details */}
        {!showOnlySearch && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Student Details
          </h2>
          <div className="flex items-center gap-6">
            <img
              src={student.image}
              alt={student.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-blue-100"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold text-gray-900">{student.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Student ID</p>
                <p className="font-semibold text-gray-900">{student.studentId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-gray-900 flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {student.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Fee</p>
                <p className="font-semibold text-gray-900">₹{(feeDetails ? feeDetails.discountedPrice : (student.totalFees - discountAmount)).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Discount Applied</p>
                <p className="font-semibold text-green-600">
                  {(feeDetails ? feeDetails.discount : discountPercent).toFixed(1)}% 
                  (₹{(feeDetails ? feeDetails.discountAmount : discountAmount).toLocaleString()})
                </p>
              </div>
            </div>
          </div>
        </div>
        )}
        {/* Pay Fee Section */}
        {!showOnlySearch && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            {/* <DollarSign className="w-5 h-5" /> */}
            <span className="text-2xl font-bold text-green-700">₹</span>
            Pay Fee
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Enter amount to pay"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                max={totalDue}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collected By <span className="text-red-500">*</span>
              </label>
              <select
                value={collectedBy}
                onChange={e => setCollectedBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select who collected payment</option>
                <option value="SuperAdmin">SuperAdmin</option>
                {staffList.map(staff => (
                  <option key={staff._id} value={`${staff.firstName} ${staff.lastName}`}>
                    {staff.firstName} {staff.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          {paymentMethod === 'Cheque' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cheque Number</label>
                <input
                  type="text"
                  value={chequeDetails.chequeNumber}
                  onChange={e => setChequeDetails({ ...chequeDetails, chequeNumber: e.target.value })}
                  placeholder="Enter cheque number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <input
                  type="text"
                  value={chequeDetails.bankName}
                  onChange={e => setChequeDetails({ ...chequeDetails, bankName: e.target.value })}
                  placeholder="Enter bank name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cheque Date</label>
                <input
                  type="date"
                  value={chequeDetails.chequeDate}
                  onChange={e => setChequeDetails({ ...chequeDetails, chequeDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                <input
                  type="text"
                  value={chequeDetails.accountHolderName}
                  onChange={e => setChequeDetails({ ...chequeDetails, accountHolderName: e.target.value })}
                  placeholder="Enter account holder name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name (optional)</label>
                <input
                  type="text"
                  value={chequeDetails.branchName}
                  onChange={e => setChequeDetails({ ...chequeDetails, branchName: e.target.value })}
                  placeholder="Enter branch name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={chequeDetails.status}
                  onChange={e => setChequeDetails({ ...chequeDetails, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Pending">Pending</option>
                  <option value="Cleared">Cleared</option>
                  <option value="Bounced">Bounced</option>
                </select>
              </div>
            </div>
          )}
          {paymentMethod === 'Online' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">UTR Number</label>
              <input
                type="text"
                value={utrNumber}
                onChange={e => setUtrNumber(e.target.value)}
                placeholder="Enter UTR number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
          {!( (localStorage.getItem('role')||'').toLowerCase().includes('clerk') ) && (
            <div className="mt-4">
              <button
                onClick={() => { handlePayFee(); }}
                disabled={
                  paymentLoading ||
                  !payAmount ||
                  parseFloat(payAmount) <= 0 ||
                  (paymentMethod === 'Online' && !utrNumber.trim()) ||
                  (paymentMethod === 'Cheque' && (!chequeDetails.chequeNumber || !chequeDetails.bankName || !chequeDetails.chequeDate || !chequeDetails.accountHolderName))
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {paymentLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  'Pay Now'
                )}
              </button>
            </div>
          )}
        </div>
        )}
        {/* Installment Structure */}
        {!showOnlySearch && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Installment Structure
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Installment No.</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {installments.map((installment, idx) => (
                  <tr key={installment._id || idx} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      Installment {idx + 1}
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      ₹{installment.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {installment.paid ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-4 h-4" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          <XCircle className="w-4 h-4" />
                          Unpaid
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
        {/* Payment History */}
        {!showOnlySearch && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Payment History
          </h2>
          {student.paymentHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Method</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Collected By</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">UTR</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {student.paymentHistory.map((payment, idx) => {
                    return (
                      <tr key={payment._id || idx} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          ₹{payment.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {(() => {
                            try {
                              // Handle both date string and Date object
                              if (typeof payment.date === 'string') {
                                // If it's already a date string (YYYY-MM-DD), format it
                                const [year, month, day] = payment.date.split('-');
                                if (year && month && day) {
                                  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                  return dateObj.toLocaleDateString('en-IN', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric'
                                  });
                                }
                              }
                              // If it's a Date object or fallback
                              const date = new Date(payment.date);
                              if (!isNaN(date.getTime())) {
                                return date.toLocaleDateString('en-IN', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric'
                                });
                              }
                              // Fallback to original date if parsing fails
                              return payment.date;
                            } catch (error) {
                              // Fallback to original date if any error
                              return payment.date;
                            }
                          })()}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {payment.method && payment.method.toLowerCase() === 'cheque' && payment.chequeDetails ? (
                            <span
                              style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => {
                                setSelectedChequeDetails(payment.chequeDetails);
                                setShowChequeModal(true);
                              }}
                            >
                              Cheque
                            </span>
                          ) : (
                            payment.method || '-'
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {payment.paidBy || 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {payment.utrNumber || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handlePrintReceipt(payment)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                              title="Print Receipt"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {!( (localStorage.getItem('role')||'').toLowerCase().includes('clerk') ) && (
                              <button
                                onClick={() => handleDeletePayment(payment._id)}
                                disabled={deletingPayment === payment._id}
                                className={`p-2 text-red-600 rounded-lg transition-colors duration-150 ${
                                  deletingPayment === payment._id 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'hover:bg-red-50'
                                }`}
                                title="Delete Payment"
                              >
                                {deletingPayment === payment._id ? (
                                  <Loader className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            {/* Edit button for Cheque payments */}
                            {payment.method && payment.method.toLowerCase() === 'cheque' && payment.chequeDetails && (
                              <button
                                onClick={() => handleEditCheque(idx, payment.chequeDetails.status)}
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors duration-150"
                                title="Edit Cheque Status"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No payment history available</p>
            </div>
          )}
        </div>
        )}
      </div>
      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <div className="mt-8 print-only" ref={receiptRef}>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-8 print:border-0 print:rounded-none">
            <div className="max-w-md mx-auto bg-white border-2 border-gray-300 p-6">
              {/* Header */}
              <div className="mb-6 border-b-2 border-gray-300 pb-4">
                <div className="flex flex-col items-start mb-2">
                  <img 
                    src="/TCIT Logo png.png" 
                    alt="TCIT Logo" 
                    className="w-[170px] h-[50px] object-contain mb-2"
                  />
                  <h1 className="text-sm font-bold text-gray-900 mt-[10px]">TALENT COMPUTER INSTITUTE</h1>
                </div>
                <p className="text-sm text-gray-600 text-center">Payment Receipt</p>
              </div>
              {/* Receipt Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="font-medium">Receipt No:</span>
                  <span>#{(receiptData._id || 0).toString().padStart(6, '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Payment Date:</span>
                  <span>{new Date(receiptData.date).toLocaleString('en-IN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Student Name:</span>
                  <span>{student.name} {student.surname || ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Father's Name:</span>
                  <span>{student.fatherName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Mother's Name:</span>
                  <span>{student.motherName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total Due Fee:</span>
                  <span>₹{totalDue.toLocaleString()}</span>
                </div>
              </div>
              {/* Payment Details */}
              <div className="border-t-2 border-gray-300 pt-4 mb-6">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Amount Paid:</span>
                  <span>₹{receiptData.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>Payment Method:</span>
                  <span>{receiptData.method}</span>
                </div>
                {receiptData.utrNumber && (
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>UTR Number:</span>
                    <span>{receiptData.utrNumber}</span>
                  </div>
                )}
              </div>
              {/* Footer */}
              <div className="border-t border-gray-300 pt-4">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div>
                    {receiptData.paidBy && (
                      <div>Collected By: {receiptData.paidBy}</div>
                    )}
                    <div className={receiptData.paidBy ? "mt-1" : ""}>Generated By: {printMeta.generatedBy}</div>
                  </div>
                  <p className="text-gray-700 font-medium text-center flex-1">Thank you for your payment!</p>
                  <div className="text-right">
                    {receiptData.paidBy && (
                      <div>Collected At: {(() => {
                        try {
                          // Handle both date string and Date object
                          if (typeof receiptData.date === 'string') {
                            // If it's already a date string (YYYY-MM-DD), format it
                            const [year, month, day] = receiptData.date.split('-');
                            if (year && month && day) {
                              const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                              return dateObj.toLocaleDateString('en-IN', { 
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              });
                            }
                          }
                          // If it's a Date object or fallback
                          const date = new Date(receiptData.date);
                          if (!isNaN(date.getTime())) {
                            return date.toLocaleDateString('en-IN', { 
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            });
                          }
                          // Fallback to original date if parsing fails
                          return receiptData.date;
                        } catch (error) {
                          // Fallback to original date if any error
                          return receiptData.date;
                        }
                      })()}</div>
                    )}
                    <div className={receiptData.paidBy ? "mt-1" : ""}>Created At: {printMeta.printedAt}</div>
                  </div>
                </div>
                <p className="text-center text-[10px] text-gray-500 mt-2">This is a computer generated receipt.</p>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-6 print:hidden">
              <button
                onClick={() => setShowReceipt(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Cheque Details Modal */}
      {showChequeModal && selectedChequeDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowChequeModal(false)}>
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-2 p-8"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition"
              onClick={() => setShowChequeModal(false)}
              type="button"
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-xl font-bold text-blue-700 mb-4 text-center">Cheque Payment Details</h3>
            <div className="mb-4">
              <div className="font-semibold text-gray-700">Cheque Number:</div>
              <div className="mb-2">{selectedChequeDetails.chequeNumber}</div>
              <div className="font-semibold text-gray-700">Bank Name:</div>
              <div className="mb-2">{selectedChequeDetails.bankName}</div>
              <div className="font-semibold text-gray-700">Cheque Date:</div>
              <div className="mb-2">{selectedChequeDetails.chequeDate ? new Date(selectedChequeDetails.chequeDate).toLocaleDateString() : ''}</div>
              <div className="font-semibold text-gray-700">Account Holder Name:</div>
              <div className="mb-2">{selectedChequeDetails.accountHolderName}</div>
              <div className="font-semibold text-gray-700">Branch Name:</div>
              <div className="mb-2">{selectedChequeDetails.branchName}</div>
              <div className="font-semibold text-gray-700">Status:</div>
              <div className="mb-2">{selectedChequeDetails.status}</div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowChequeModal(false)}
                className="px-5 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Cheque Status Modal */}
      {editChequeModal && editChequePaymentIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setEditChequeModal(false)}>
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-2 p-8"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition"
              onClick={() => setEditChequeModal(false)}
              type="button"
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-xl font-bold text-blue-700 mb-4 text-center">Edit Cheque Status</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={editChequeStatus}
                onChange={e => setEditChequeStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Pending">Pending</option>
                <option value="Cleared">Cleared</option>
                <option value="Bounced">Bounced</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditChequeModal(false)}
                className="px-5 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateChequeStatus}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentFee;
