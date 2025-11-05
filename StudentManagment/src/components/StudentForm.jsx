import React, { useState, useEffect, useRef, useMemo } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Select from 'react-select';
import Avatar from './Avatar';
import './StudentForm.css';

function calculateInstallments(total, count = 3) {
  count = Math.max(1, Math.min(count, 12));
  if (count === 1) {
    // Single instalment, round to nearest 100
    let amt = Math.round(total);
    let last2 = amt % 100;
    if (last2 < 50) {
      amt = amt - last2;
    } else {
      amt = amt + (100 - last2);
    }
    return [{ amount: amt }];
  }
  // 1st instalment
  let normal = total / count;
  let first = normal + 2000;
  first = Math.round(first);
  let last2 = first % 100;
  if (last2 < 50) {
    first = first - last2;
  } else {
    first = first + (100 - last2);
  }
  // Baaki amount
  let restAmount = total - first;
  let restCount = count - 1;
  let eachRest = restAmount / restCount;
  let installments = [{ amount: first }];
  let sum = first;
  for (let i = 1; i < count; i++) {
    let amt = eachRest;
    let last2 = amt % 100;
    if (last2 < 50) {
      amt = amt - last2;
    } else {
      amt = amt + (100 - last2);
    }
    amt = Math.round(amt);
    installments.push({ amount: amt });
    sum += amt;
  }
  // Adjustment in last instalment
  let diff = total - sum;
  installments[installments.length - 1].amount += diff;
  // Last instalment ko bhi 100 pe round karo
  let lastAmt = installments[installments.length - 1].amount;
  let last2last = lastAmt % 100;
  if (last2last < 50) {
    lastAmt = lastAmt - last2last;
  } else {
    lastAmt = lastAmt + (100 - last2last);
  }
  installments[installments.length - 1].amount = lastAmt;
  // Final adjustment if rounding ne total bigaad diya
  let finalSum = installments.reduce((a, b) => a + b.amount, 0);
  if (finalSum !== total) {
    installments[installments.length - 1].amount += (total - finalSum);
  }
  return installments;
}

const StudentForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const studentId = location.state && location.state.studentId;
  const [editingStudent, setEditingStudent] = useState(location.state && location.state.student);
  const readOnly = location.state && location.state.readOnly;
  const [form, setForm] = useState({
    studentId: "",
    password: "",
    name: "",
    surname: "",
    fatherHusbandName: "",
    fatherName: "",
    fatherOccupation: "N/A",
    motherName: "",
    motherOccupation: "N/A",
    email: "",
    dob: "",
    gender: "",
    educationLevel: "",
    schoolCollegeName: "",
    aadhar: "",
    address: "",
    area: "",
    city: "",
    pinCode: "",
    contactNo: "",
    fatherNo: "",
    homeContact: "",
    image: null,
    selectedCourses: [],
    discount: 0,
    totalFees: 0,
    installment: 1,
    formNo: "",
    date: new Date().toISOString().split('T')[0], // Set current date as default
    reference: "",
    inquiryBy: "",
    inquiryDate: "",
    enquiryType: "Enquiry", // New field for Enquiry or Admission with default value
    marksheets: [],
    courseStatus: "padding",
    courseProgress: {},
    finalAmount: 0,
  });
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [maxDate, setMaxDate] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [feeDetails, setFeeDetails] = useState(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const formatDateOnly = (value) => {
    if (!value) return '';
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const parts = value.split('T');
      if (parts && parts[0] && /^\d{4}-\d{2}-\d{2}$/.test(parts[0])) return parts[0];
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      return value;
    }
    if (value instanceof Date && !isNaN(value.getTime())) return value.toISOString().slice(0, 10);
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    } catch (_) {}
    return String(value);
  };

  // Group courses by category for selection dropdown (Basic, IT)
  const groupedCourseOptions = useMemo(() => {
    const toOption = (course) => ({
      value: course._id,
      label: `${course.name} - ₹${course.fees ? Number(course.fees).toLocaleString() : (course.price ? Number(course.price).toLocaleString() : '0')}`
    });
    const basic = (courses || [])
      .filter(c => (c.category || '').toLowerCase() === 'basic')
      .map(toOption);
    const it = (courses || [])
      .filter(c => (c.category || '').toLowerCase() === 'it')
      .map(toOption);
    return [
      { label: 'Basic Courses', options: basic },
      { label: 'IT Courses', options: it },
    ];
  }, [courses]);

  // Prefill next Form No. for new registrations
  useEffect(() => {
    const prefillFormNo = async () => {
      if (!editingStudent) {
        try {
          const res = await api.get('/students/next-form-no');
          const next = res.data?.nextFormNo || '';
          setForm(prev => ({ ...prev, formNo: next }));
        } catch (e) {
          // silent fail; user can still type manually
        }
      }
    };
    prefillFormNo();
  }, [editingStudent]);

  // Add dialog state for marksheet preview
  const [openMarksheetDialog, setOpenMarksheetDialog] = useState(null);
  const imgRef = useRef();

  const getAbsoluteFileUrl = (maybeRelativeUrl) => {
    if (!maybeRelativeUrl) return null;
    if (typeof maybeRelativeUrl !== 'string') return null;
    if (maybeRelativeUrl.startsWith('http://') || maybeRelativeUrl.startsWith('https://') || maybeRelativeUrl.startsWith('data:')) {
      return maybeRelativeUrl;
    }
    const apiBase = (api?.defaults?.baseURL || '').replace(/\/api\/?$/, '');
    const normalizedPath = maybeRelativeUrl.startsWith('/') ? maybeRelativeUrl : `/${maybeRelativeUrl}`;
    return `${apiBase}${normalizedPath}`;
  };

  useEffect(() => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 6);
    setMaxDate(today.toISOString().split('T')[0]);
  }, []);

  // Ensure profile image prints reliably (use data URL for File)
  useEffect(() => {
    const val = form.image;
    if (!val) {
      setImagePreview(null);
      return;
    }
    if (typeof val === 'string') {
      const abs = getAbsoluteFileUrl(val);
      setImagePreview(abs);
      // Try to cache as data URL to improve print reliability
      if (abs && abs.startsWith('http')) {
        try {
          fetch(abs, { mode: 'cors' })
            .then(r => r.ok ? r.blob() : Promise.reject(new Error('Image fetch failed')))
            .then(blob => new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = e => resolve(e.target.result);
              reader.readAsDataURL(blob);
            }))
            .then(dataUrl => {
              if (typeof dataUrl === 'string') setImagePreview(dataUrl);
            })
            .catch(() => {});
        } catch (_) {}
      }
      return;
    }
    if (val instanceof File) {
      const reader = new FileReader();
      reader.onload = e => setImagePreview(e.target.result);
      reader.readAsDataURL(val);
    }
  }, [form.image]);

  // Fetch fee details when editing student
  useEffect(() => {
    if (editingStudent && editingStudent._id) {
      const fetchFeeDetails = async () => {
        try {
          const response = await api.get(`/students/${editingStudent._id}/fee-details`);
          setFeeDetails(response.data);
        } catch (error) {
          console.error('Error fetching fee details:', error);
        }
      };
      fetchFeeDetails();
    }
  }, [editingStudent]);

  // Merge price summary and installment calculation into one useEffect
  useEffect(() => {
    // Calculate real-time values when form changes
    const totalPrice = calculateTotalPrice();
    const discountAmount = (totalPrice * form.discount) / 100;
    const discountedPrice = totalPrice - discountAmount;
    const totalPaid = editingStudent && editingStudent.paymentHistory ? 
      editingStudent.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0) : 0;
    const finalAmount = discountedPrice - totalPaid;

    // Installment calculation - sirf new student ke liye ya manual change ke liye
    let newInstallments;
    if (editingStudent && editingStudent.installments && editingStudent.installments.length > 0 && !isFormDirty) {
      // Edit mode me initial load: backend se aaye hue installments use karo
      newInstallments = editingStudent.installments;
    } else {
      // New student ya manual change ke liye: recalculate karo
      const installmentCount = Number(form.installment);
      const discountedAmount = Math.round(discountedPrice);
      newInstallments = calculateInstallments(discountedAmount, installmentCount);
    }

    setForm(prev => ({
      ...prev,
      totalPrice,
      discountAmount,
      discountedPrice,
      finalAmount,
      totalFees: Math.round(discountedPrice),
      installments: newInstallments,
      originalInstallments: newInstallments
    }));
  }, [form.selectedCourses, form.discount, form.installment, courses, editingStudent, isFormDirty]);

  // Set isFormDirty true on course or discount change
  useEffect(() => {
    if (editingStudent) {
      setIsFormDirty(true);
    }
  }, [form.selectedCourses, form.discount, form.installment]);

  // Function to fetch courses
  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const res = await api.get("/studentcourses");
      setCourses(res.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
      toast.error("Failed to update course list");
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchCourses();
    
    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(fetchCourses, 30000);
    
    // Set inquiry date to current date and time for new students
    if (!editingStudent && !form.inquiryDate) {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      setForm(prev => ({
        ...prev,
        inquiryDate: currentDate
      }));
    }
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [editingStudent, form.inquiryDate]);

  useEffect(() => {
    if (editingStudent) {
      
      // Backend se aaye hue data ko copy karo, lekin installment field remove karo
      const { installment, ...editingStudentWithoutInstallment } = editingStudent;
      
      setForm(f => ({
        ...f,
        ...editingStudentWithoutInstallment,
        dob: formatDateOnly(editingStudent.dob),
        marksheets: editingStudent.marksheets || [],
        installment: editingStudent.installments ? editingStudent.installments.length : 1,
        installments: editingStudent.installments || [],
        originalInstallments: editingStudent.originalInstallments || [],
        image: editingStudent.image || null,
        selectedCourses: (editingStudent.selectedCourses || []).map(c => c._id || c),
        courseProgress: (() => {
          const progress = editingStudent.courseProgress 
            ? (editingStudent.courseProgress instanceof Map 
                ? Object.fromEntries(editingStudent.courseProgress) 
                : editingStudent.courseProgress)
            : {};
          return progress;
        })(),
        password: "", // Edit mode me password field blank hi rahegi, kyunki backend se original password nahi mil sakta (security reason)
        courseStatus: editingStudent.courseStatus || "padding",
      }));
      setIsFormDirty(false);
    }
  }, []);

  useEffect(() => {
    if (studentId && (!editingStudent || !editingStudent.marksheets || editingStudent.marksheets.length === 0)) {
      api.get(`/students/${studentId}`).then(res => {
        
        // Backend se aaye hue data ko copy karo, lekin installment field remove karo
        const { installment, ...resDataWithoutInstallment } = res.data;
        
        setForm(f => ({
          ...f,
          ...resDataWithoutInstallment,
          dob: formatDateOnly(res.data.dob),
          marksheets: res.data.marksheets || [],
          installment: res.data.installments ? res.data.installments.length : 1,
          installments: res.data.installments || [],
          originalInstallments: res.data.originalInstallments || [],
          image: res.data.image || null,
          selectedCourses: (res.data.selectedCourses || []).map(c => c._id || c),
          courseProgress: res.data.courseProgress 
            ? (res.data.courseProgress instanceof Map 
                ? Object.fromEntries(res.data.courseProgress) 
                : res.data.courseProgress)
            : {},
          password: "", // Always blank in edit mode
          courseStatus: res.data.courseStatus || "padding",
        }));
      });
    }
  }, [studentId]);

  // Use installments from form state instead of recalculating
  const installments = form.installments || calculateInstallments(form.totalFees, Number(form.installment));

  const handleChange = e => {
    const { name, value, type, files } = e.target;
    
    // Special handling for installment field
    if (name === 'installment') {
      const installmentValue = Math.max(1, Number(value)); // Ensure minimum 1
      
      setForm(f => ({
        ...f,
        [name]: installmentValue, // Convert to number immediately
      }));
      
      // Immediately set isFormDirty for installment changes
      if (editingStudent) {
        setIsFormDirty(true);
      }
    } else {
      setForm(f => ({
        ...f,
        [name]: type === "file" ? files[0] : value,
      }));
    }
  };

  const handleMarksheetUpload = e => {
    const files = Array.from(e.target.files);
    setForm(f => ({
      ...f,
      marksheets: [...f.marksheets, ...files]
    }));
  };

  const removeMarksheet = (index) => {
    setForm(f => ({
      ...f,
      marksheets: f.marksheets.filter((_, i) => i !== index)
    }));
  };

  const removeCourse = (courseId) => {
    setForm(f => ({
      ...f,
      selectedCourses: f.selectedCourses.filter(id => id !== courseId),
    }));
  };

  const calculateTotalPrice = () => {
    // Debug ke liye: dekhte hain selected courses aur sabhi courses kya hain
    const selected = courses.filter(c => form.selectedCourses.includes(c._id));
    // Total price bhi print karte hain
    const total = selected.reduce((sum, c) => sum + Number(c.fees || c.price || 0), 0);
    return total;
  };

  const calculateDiscountedPrice = () => {
    const total = calculateTotalPrice();
    return Math.round(total - (total * (form.discount || 0) / 100));
  };

  const calculateInstallmentBreakdown = () => {
    // Use installments from form state if available, otherwise calculate
    if (form.installments) {
      return form.installments;
    }
    const discounted = calculateDiscountedPrice();
    return calculateInstallments(discounted, Number(form.installment));
  };

  const validate = () => {
    const newErrors = {};
    // StudentID is now optional - no validation required
    // if (!form.studentId) newErrors.studentId = "Student ID is required";
    if (!form.name) newErrors.name = "Name is required";
    if (!form.surname) newErrors.surname = "Surname is required";
    if (!form.fatherHusbandName) newErrors.fatherHusbandName = "Father/Husband Name is required";
    if (!form.fatherName) newErrors.fatherName = "Father Name is required";
    if (!form.email) newErrors.email = "Email is required";
    if (!form.dob) newErrors.dob = "Date of Birth is required";
    if (!form.gender) newErrors.gender = "Gender is required";
    if (!form.educationLevel) newErrors.educationLevel = "Education Level is required";
    if (!form.aadhar || !/^[0-9]{12}$/.test(form.aadhar)) newErrors.aadhar = "Aadhar must be 12 digits";
    if (!form.contactNo || !/^[0-9]{10}$/.test(form.contactNo)) newErrors.contactNo = "Contact No. must be 10 digits";
    if (form.contactNo && /[^0-9]/.test(form.contactNo)) newErrors.contactNo = "Contact No. must contain only numbers";
    if (!form.fatherNo || !/^[0-9]{10}$/.test(form.fatherNo)) newErrors.fatherNo = "Father No. must be 10 digits";
    if (form.fatherNo && /[^0-9]/.test(form.fatherNo)) newErrors.fatherNo = "Father No. must contain only numbers";
    if (!form.homeContact || !/^[0-9]{10}$/.test(form.homeContact)) newErrors.homeContact = "Home Contact must be 10 digits";
    if (form.homeContact && /[^0-9]/.test(form.homeContact)) newErrors.homeContact = "Home Contact must contain only numbers";
    if (!form.address) newErrors.address = "Address is required";
    if (!form.area) newErrors.area = "Area is required";
    if (!form.city) newErrors.city = "City is required";
    if (!form.pinCode) newErrors.pinCode = "Pin Code is required";
    if (!form.reference) newErrors.reference = "Reference is required";
    if (!form.inquiryBy) newErrors.inquiryBy = "Inquiry By is required";
    if (!form.inquiryDate) newErrors.inquiryDate = "Inquiry Date is required";
    if (!form.enquiryType) newErrors.enquiryType = "Enquiry Type is required";
    
    // Admission Date validation - only required when Enquiry Type is "Admission"
    if (form.enquiryType === 'Admission' && !form.date) {
      newErrors.date = "Admission Date is required when Enquiry Type is Admission";
    }
    
    // Password is now optional - only validate if provided
    // if (!editingStudent && !form.password) newErrors.password = "Password is required";
    if (!editingStudent && form.password && form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!form.selectedCourses.length) newErrors.selectedCourses = "Select at least one course";
    if (!form.installment || form.installment < 1) newErrors.installment = "At least 1 installment required";
    if (!form.formNo) newErrors.formNo = "Form No. is required";
    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const { isValid, newErrors } = validate();
    if (!isValid) {
      const firstError = Object.values(newErrors)[0];
      if (firstError) toast.error(firstError);
      setLoading(false);
      return;
    }
    // Age validation
    const birthDate = new Date(form.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 6) {
      setError("Student must be at least 6 years old to register");
      toast.error("Student must be at least 6 years old to register");
      setLoading(false);
      return;
    }
    try {
      const formData = new FormData();
      // Purani marksheets (string URLs)
      const oldMarksheets = form.marksheets.filter(f => typeof f === 'string');
      formData.append('marksheets', JSON.stringify(oldMarksheets));
      // Baaki fields
      Object.entries({
        ...form,
        fatherOccupation: form.fatherOccupation && form.fatherOccupation.trim() ? form.fatherOccupation : 'N/A',
        motherOccupation: form.motherOccupation && form.motherOccupation.trim() ? form.motherOccupation : 'N/A',
      }).forEach(([key, value]) => {
        if (key === "selectedCourses") {
          formData.append("selectedCourses", JSON.stringify(value));
        } else if (key === "image" && value instanceof File) {
          formData.append("image", value);
        } else if (key === "marksheets" && Array.isArray(value)) {
          value.forEach((file) => {
            if (typeof file !== 'string') {
              formData.append(`marksheets`, file);
            }
          });
        } else if (key === "courseStatus") {
          formData.append("courseStatus", value);
        } else if (key === "courseProgress") {
          formData.append("courseProgress", JSON.stringify(value));
        } else if (key === "password" && !value) {
          // Agar password blank hai to usko formData me mat bhejo (edit ke time purana password hi rahega)
        } else if (key !== "installments" && key !== "originalInstallments" && value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      let response;
      if (editingStudent && editingStudent._id) {
        response = await api.put(`/students/${editingStudent._id}`, formData);
      } else {
        response = await api.post("/students/register", formData);
      }
      // Conditional success messages based on enquiry type
      const successMessage = editingStudent 
        ? `Student ${form.enquiryType === 'Enquiry' ? 'enquiry' : 'admission'} updated successfully!`
        : `Student ${form.enquiryType === 'Enquiry' ? 'enquiry' : 'admission'} registered successfully!`;
      
      setSuccess(successMessage);
      toast.success(successMessage);
      
      // Conditional navigation based on enquiry type
      if (form.enquiryType === 'Enquiry') {
        navigate('/enquiries');
      } else if (form.enquiryType === 'Admission') {
        navigate('/students');
      } else {
        // Fallback to students route
        navigate('/students');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    const { isValid, newErrors } = validate();
    if (!isValid) {
      const firstError = Object.values(newErrors)[0] || 'Please fill required fields before printing';
      toast.error(firstError);
      return;
    }
    // Ensure any images (like Student Photo) are fully decoded before printing
    const imgs = Array.from(document.querySelectorAll('.print-area img'));
    const decodePromises = imgs.map(img => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()));
    const timeout = new Promise(resolve => setTimeout(resolve, 800));
    await Promise.race([Promise.all(decodePromises), timeout]);
    window.print();
  };

  useEffect(() => {
    if (openMarksheetDialog && imgRef.current) {
      imgRef.current.style.setProperty('height', '100%', 'important');
      imgRef.current.style.setProperty('width', '100%', 'important');
      imgRef.current.style.setProperty('object-fit', 'contain', 'important');
      imgRef.current.style.setProperty('display', 'block', 'important');
      imgRef.current.style.setProperty('-webkit-user-select', 'none', 'important');
    }
  }, [openMarksheetDialog]);

  // Helper to detect file type
  const getFileType = (file) => {
    if (!file) return '';
    if (file.type) return file.type.startsWith('image') ? 'image' : (file.type.includes('pdf') ? 'pdf' : '');
    if (typeof file === 'string') {
      const ext = file.split('.').pop().toLowerCase();
      if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) return 'image';
      if (["pdf"].includes(ext)) return 'pdf';
    }
    return '';
  };

  useEffect(() => {
    if (editingStudent) {
      // Backend se aaye hue data ko copy karo, lekin password field remove karo
      const { password, ...editingStudentWithoutPassword } = editingStudent;
      
      // Initialize form state with backend data, but do NOT set totalPrice, discountAmount, discountedPrice, finalAmount
      setForm({
        ...editingStudentWithoutPassword,
        dob: formatDateOnly(editingStudent.dob), // Properly format DOB
        selectedCourses: Array.isArray(editingStudent.selectedCourses)
          ? editingStudent.selectedCourses.map(c => typeof c === 'object' ? c._id : c)
          : [],
        courseProgress: editingStudent.courseProgress 
          ? (editingStudent.courseProgress instanceof Map 
              ? Object.fromEntries(editingStudent.courseProgress) 
              : editingStudent.courseProgress)
          : {},
        discount: editingStudent.discount || 0,
        installment: editingStudent.installments ? editingStudent.installments.length : 1,
        password: "" // Always blank in edit mode
      });
      setIsFormDirty(false);
    }
  }, [editingStudent]);

  useEffect(() => {
    if (feeDetails) {
      // Fee details available
    }
    if (editingStudent) {
      // Editing student data available
    }
  }, [feeDetails, editingStudent, form]);

  const selectedCourseDetails = useMemo(() => {
    return courses
      .filter(c => form.selectedCourses.includes(c._id))
      .map(c => ({ name: c.name, fee: Number(c.fees || c.price || 0) }));
  }, [form.selectedCourses, courses]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 print-area">
          {/* Header */}
          <div className="bg-blue-600 px-8 py-6 text-center">
            <h1 className="text-3xl font-bold text-white tracking-wide">
              {form.enquiryType === 'Enquiry' ? 'ENQUIRY FORM' : 'ADMISSION FORM'}
            </h1>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-8 screen-only">
            {/* Basic Information */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                {/* Form No. */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Form No.</label>
                  <input 
                    type="text" 
                    name="formNo" 
                    value={form.formNo || ''} 
                    className="w-full px-4 py-3 rounded-md bg-gray-100 border border-gray-200 text-gray-700 cursor-not-allowed" 
                    disabled={true} 
                    readOnly={true} 
                    style={{ cursor: 'not-allowed' }}
                  />
                </div>
                {/* Student ID */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Student ID <span className="text-gray-500 font-normal">(Optional)</span></label>
                  <input
                    type="text"
                    name="studentId"
                    value={form.studentId}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'cursor-not-allowed' : ''}`}
                    disabled={readOnly}
                    readOnly={readOnly}
                    style={readOnly ? { cursor: 'not-allowed' } : {}}
                  />
                  {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
                </div>
                {/* Password (always show) */}
                {!readOnly && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Password <span className="text-gray-500 font-normal">(Optional)</span></label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-md bg-gray-50 border ${errors.password ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                    <span
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500"
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={0}
                      role="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
                )}
                {/* Student Photo Upload */}
                {!readOnly && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Student Photo</label>
                  <div className="flex items-center space-x-4">
                    {/* Image Preview or Default Icon */}
                <Avatar
                  src={imagePreview}
                  name={form.name}
                  size="lg"
                  className="border-2 border-gray-300"
                />
                {/* Upload Button */}
                    <div>
                <input
                        id="student-image-input"
                        name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('student-image-input').click()}
                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition cursor-pointer shadow-sm text-sm font-medium"
                >
                  Upload Photo
                </button>
                    </div>
                  </div>
                </div>
                )}
                

              </div>
            </div>

            {/* Course Progress Section (Separate from Basic Information) */}
            {editingStudent && form.selectedCourses && form.selectedCourses.length > 0 && form.enquiryType !== 'Enquiry' && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-blue-600 mb-4">Course Progress</h2>
                <div className="w-full">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Individual Course Status</label>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      {courses
                        .filter(course => form.selectedCourses.includes(course._id))
                        .map(course => {
                          const isCompleted = form.courseProgress[course._id] || false;
                          return (
                            <div key={course._id} className="flex items-center justify-between bg-white p-3 rounded-md border">
                              <div className="flex-1">
                                <span className="font-medium text-gray-800">{course.name}</span>
                                <span className="text-sm text-gray-500 ml-2">
                                  (₹{course.fees ? Number(course.fees).toLocaleString() : (course.price ? Number(course.price).toLocaleString() : '0')})
                                </span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 'text-orange-600'}`}>
                                  {isCompleted ? 'Completed' : 'In Progress'}
                                </span>
                                {!readOnly && (
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isCompleted}
                                      onChange={(e) => {
                                        const newProgress = { ...form.courseProgress };
                                        newProgress[course._id] = e.target.checked;
                                        
                                        // Check if all courses are completed
                                        const allCompleted = form.selectedCourses.every(courseId => newProgress[courseId]);
                                        
                                        setForm(prev => ({
                                          ...prev,
                                          courseProgress: newProgress,
                                          courseStatus: allCompleted ? 'completed' : 'padding'
                                        }));
                                      }}
                                      className="sr-only"
                                    />
                                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer ${isCompleted ? 'bg-green-600' : 'bg-gray-200'} transition-colors duration-200`}>
                                      <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform duration-200 ${isCompleted ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </div>
                                  </label>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      <div className="mt-4 p-3 bg-blue-50 rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-800">Overall Status:</span>
                          <span className={`font-bold text-lg ${form.courseStatus === 'completed' ? 'text-green-600' : 'text-orange-600'}`}>
                            {form.courseStatus === 'completed' ? 'All Courses Completed' : 'Courses In Progress'}
                          </span>
                        </div>
                      </div>
                    </div>
                </div>
              </div>
            )}

            {/* Student Information */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Student Information</h2>
              {/* Row 1: Student Name, Surname, Father/Husband Name */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Student Name</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Father/Husband Name</label>
                  <input type="text" name="fatherHusbandName" value={form.fatherHusbandName || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Surname</label>
                  <input type="text" name="surname" value={form.surname || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                </div>
              </div>
              {/* Row 2: Birth Date, Gender, Education Level */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4 items-center">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Birth Date</label>
                  <input type="date" name="dob" value={form.dob} onChange={handleChange} max={maxDate} className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                </div>
                <div className="flex flex-col justify-center">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                  <div className="flex items-center space-x-6 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="gender" value="male" checked={form.gender === 'male'} onChange={handleChange} className="form-radio text-blue-600" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                      <span>Male</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="gender" value="female" checked={form.gender === 'female'} onChange={handleChange} className="form-radio text-blue-600" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                      <span>Female</span>
                    </label>
                  </div>
                  {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                </div>
                <div className="flex flex-col justify-center">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Education Level</label>
                  <div className="flex items-center space-x-2 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="educationLevel" value="10th" checked={form.educationLevel === '10th'} onChange={handleChange} className="form-radio text-blue-600" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                      <span>10th</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="educationLevel" value="12th" checked={form.educationLevel === '12th'} onChange={handleChange} className="form-radio text-blue-600" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                      <span>12th</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="educationLevel" value="UG" checked={form.educationLevel === 'UG'} onChange={handleChange} className="form-radio text-blue-600" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                      <span>UG</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="educationLevel" value="PG" checked={form.educationLevel === 'PG'} onChange={handleChange} className="form-radio text-blue-600" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                      <span>PG</span>
                    </label>
                  </div>
                  {errors.educationLevel && <p className="text-red-500 text-xs mt-1">{errors.educationLevel}</p>}
                </div>
              </div>
              {/* Row 2.5: School/College Name */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">School/College Name</label>
                  <input type="text" name="schoolCollegeName" value={form.schoolCollegeName || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                </div>
              </div>
              {/* Row 3: Aadhar Card No. and Upload/View Marksheets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Aadhar Card No.</label>
                  <input type="text" name="aadhar" value={form.aadhar || ''} onChange={handleChange} maxLength={12} className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                  {errors.aadhar && <p className="text-red-500 text-xs mt-1">{errors.aadhar}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{readOnly ? 'View Marksheets' : 'Upload Marksheets'}</label>
                  {!readOnly && (
                    <>
                      <input 
                        type="file" 
                        multiple
                        accept="image/*,application/pdf" 
                        onChange={handleMarksheetUpload} 
                        className="w-full px-4 py-2 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      />
                      <p className="text-xs text-gray-500 mt-1">You can select multiple files (images/PDFs)</p>
                    </>
                  )}
                  {/* Display uploaded marksheets */}
                  {form.marksheets.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-gray-700">{readOnly ? 'Uploaded Marksheets:' : 'Selected Marksheets:'}</p>
                      {form.marksheets.map((file, index) => {
                        // Agar file ek string hai (URL), to filename extract karo
                        const fileName = typeof file === 'string'
                          ? file.split('/').pop().split('?')[0]
                          : file.name;

                        return (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-600">
                                {fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName}
                            </span>
                            <span className="text-xs text-gray-400">
                              {file.size ? `(${(file.size / 1024 / 1024).toFixed(2)} MB)` : ''}
                            </span>
                          </div>
                          {readOnly ? (
                            <button
                              type="button"
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                              onClick={() => setOpenMarksheetDialog(file)}
                            >
                              View
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => removeMarksheet(index)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              {/* Row 3: Father Name, Father Occupation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Father Name</label>
                  <input type="text" name="fatherName" value={form.fatherName || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Father Occupation</label>
                  <input type="text" name="fatherOccupation" value={form.fatherOccupation || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                </div>
              </div>
              {/* Row 4: Mother Name, Mother Occupation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Mother Name</label>
                  <input type="text" name="motherName" value={form.motherName || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Mother Occupation</label>
                  <input type="text" name="motherOccupation" value={form.motherOccupation || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                </div>
              </div>
              </div>

            {/* Address Information */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Address Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Address - full width */}
                <div className="md:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                  <input type="text" name="address" value={form.address || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                </div>
                {/* Area, City, Pin Code */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Area</label>
                  <input type="text" name="area" value={form.area || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                  <input type="text" name="city" value={form.city || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Pin Code</label>
                  <input type="text" name="pinCode" value={form.pinCode || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                </div>
                {/* Contact No., Father No., E-mail ID */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Contact No.</label>
                  <input
                    type="text"
                    name="contactNo"
                    value={form.contactNo}
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setForm(f => ({ ...f, contactNo: value }));
                    }}
                    maxLength={10}
                    className={`w-full px-4 py-3 rounded-md bg-gray-50 border ${errors.contactNo ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'cursor-not-allowed' : ''}`}
                    disabled={readOnly}
                    readOnly={readOnly}
                    style={readOnly ? { cursor: 'not-allowed' } : {}}
                  />
                  {errors.contactNo && <p className="text-red-500 text-xs mt-1">{errors.contactNo}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Father No.</label>
                  <input
                    type="text"
                    name="fatherNo"
                    value={form.fatherNo}
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setForm(f => ({ ...f, fatherNo: value }));
                    }}
                    maxLength={10}
                    className={`w-full px-4 py-3 rounded-md bg-gray-50 border ${errors.fatherNo ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'cursor-not-allowed' : ''}`}
                    disabled={readOnly}
                    readOnly={readOnly}
                    style={readOnly ? { cursor: 'not-allowed' } : {}}
                  />
                  {errors.fatherNo && <p className="text-red-500 text-xs mt-1">{errors.fatherNo}</p>}
              </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail ID</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                </div>
                {/* Home Contact - full width */}
                <div className="md:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Home Contact</label>
                  <input
                    type="text"
                    name="homeContact"
                    value={form.homeContact}
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setForm(f => ({ ...f, homeContact: value }));
                    }}
                    maxLength={10}
                    className={`w-full px-4 py-3 rounded-md bg-gray-50 border ${errors.homeContact ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'cursor-not-allowed' : ''}`}
                    disabled={readOnly}
                    readOnly={readOnly}
                    style={readOnly ? { cursor: 'not-allowed' } : {}}
                  />
                  {errors.homeContact && <p className="text-red-500 text-xs mt-1">{errors.homeContact}</p>}
              </div>
              </div>
            </div>

            {/* Course Selection - Multi-select Dropdown (react-select) */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Course Information</h2>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-semibold text-gray-700">Select Courses</label>
                  <span className="text-xs text-gray-500">(Auto-refresh every 30s)</span>
                </div>
                <button
                  type="button"
                  onClick={fetchCourses}
                  disabled={coursesLoading}
                  className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                    coursesLoading 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  title="Refresh course list"
                >
                  <svg className={`w-3 h-3 ${coursesLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {coursesLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <Select
                isMulti
                name="selectedCourses"
                options={groupedCourseOptions}
                value={courses
                  .filter(course => form.selectedCourses.includes(course._id))
                  .map(course => ({
                  value: course._id,
                  label: `${course.name} - ₹${course.fees ? Number(course.fees).toLocaleString() : (course.price ? Number(course.price).toLocaleString() : '0')}`
                  }))
                }
                onChange={selectedOptions => {
                  if (!readOnly) {
                    const selectedCourseIds = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
                    setForm(prev => {
                      const selected = courses.filter(c => selectedCourseIds.includes(c._id));
                      const totalPrice = selected.reduce((sum, c) => sum + Number(c.fees || c.price || 0), 0);
                      const discountAmount = (totalPrice * prev.discount) / 100;
                      const discountedPrice = totalPrice - discountAmount;
                      const totalPaid = editingStudent && editingStudent.paymentHistory
                        ? editingStudent.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0)
                        : 0;
                      const finalAmount = discountedPrice - totalPaid;
                      const newInstallments = calculateInstallments(Math.round(discountedPrice), Number(prev.installment));
                      return {
                        ...prev,
                        selectedCourses: selectedCourseIds,
                        totalPrice,
                        discountAmount,
                        discountedPrice,
                        finalAmount,
                        totalFees: Math.round(discountedPrice),
                        installments: newInstallments,
                        originalInstallments: newInstallments
                      };
                    });
                  }
                }}
                placeholder="Select one or more courses..."
                isDisabled={readOnly}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: '48px',
                    borderRadius: '0.75rem',
                    borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
                    boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 1px 2px 0 #e5e7eb',
                    '&:hover': { borderColor: '#2563eb' },
                    fontSize: '1rem',
                    backgroundColor: '#f8fafc',
                    cursor: readOnly ? 'not-allowed' : 'pointer',
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: '#64748b',
                    fontSize: '1rem',
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: '#2563eb22',
                    borderRadius: '0.5rem',
                    padding: '2px 6px',
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: '#2563eb',
                    fontWeight: 500,
                  }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: '#2563eb',
                    ':hover': { backgroundColor: '#2563eb33', color: '#1d4ed8' },
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 50,
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 24px 0 #00000011',
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    marginTop: 4,
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? '#2563eb22'
                      : state.isFocused
                      ? '#eff6ff'
                      : '#fff',
                    color: '#0f172a',
                    fontWeight: state.isSelected ? 600 : 400,
                    borderRadius: '0.5rem',
                    padding: '10px 16px',
                    cursor: readOnly ? 'not-allowed' : 'pointer',
                  }),
                  dropdownIndicator: (base, state) => ({
                    ...base,
                    color: state.isFocused ? '#2563eb' : '#64748b',
                    '&:hover': { color: '#2563eb' },
                  }),
                  indicatorSeparator: () => ({ display: 'none' }),
                }}
              />
            </div>

            {/* Fee Information */}
            {form.selectedCourses.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-blue-600 mb-4">Fee Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Discount (%)</label>
                    <input 
                      type="number" 
                      name="discount" 
                      value={form.discount} 
                      onChange={e => {
                        const discountValue = Number(e.target.value);
                        setForm(prev => {
                          const selected = courses.filter(c => prev.selectedCourses.includes(c._id));
                          const totalPrice = selected.reduce((sum, c) => sum + Number(c.fees || c.price || 0), 0);
                          const discountAmount = (totalPrice * discountValue) / 100;
                          const discountedPrice = totalPrice - discountAmount;
                          const totalPaid = editingStudent && editingStudent.paymentHistory
                            ? editingStudent.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0)
                            : 0;
                          const finalAmount = discountedPrice - totalPaid;
                          const newInstallments = calculateInstallments(Math.round(discountedPrice), Number(prev.installment));
                          return {
                            ...prev,
                            discount: discountValue,
                            totalPrice,
                            discountAmount,
                            discountedPrice,
                            finalAmount,
                            totalFees: Math.round(discountedPrice),
                            installments: newInstallments,
                            originalInstallments: newInstallments
                          };
                        });
                      }} 
                      className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      min="0" 
                      max="100" 
                      disabled={readOnly} 
                      readOnly={readOnly} 
                      style={readOnly ? { cursor: 'not-allowed' } : {}} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Installments</label>
                    <input type="number" name="installment" value={form.installment} onChange={handleChange} className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" min="1" max="12" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                  </div>
                </div>
                {/* Price Summary */}
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">₹</span>
                  Price Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Course Price:</span>
                    <span className="font-medium">₹{(isFormDirty ? (form.totalPrice || calculateTotalPrice()) : (feeDetails ? feeDetails.totalPrice : calculateTotalPrice())).toLocaleString()}</span>
                  </div>
                  {(form.discount > 0 || (feeDetails && feeDetails.discount > 0)) && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({isFormDirty ? form.discount : (feeDetails ? feeDetails.discount : form.discount)}%):</span>
                      <span>-₹{(isFormDirty ? (form.discountAmount || ((calculateTotalPrice() * form.discount) / 100)) : (feeDetails ? feeDetails.discountAmount : ((calculateTotalPrice() * form.discount) / 100))).toLocaleString()}</span>
                    </div>
                  )}
                  {/* Total Paid Amount - Only show in edit mode */}
                  {editingStudent && (feeDetails ? feeDetails.totalPaid > 0 : (editingStudent.paymentHistory && editingStudent.paymentHistory.length > 0)) && (
                    <div className="flex justify-between text-blue-600">
                      <span>Total Paid Amount:</span>
                      <span>₹{(feeDetails ? feeDetails.totalPaid : (editingStudent.paymentHistory ? editingStudent.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0) : 0)).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Final Amount:</span>
                    <span>
                      ₹{(form.finalAmount !== undefined && form.finalAmount !== null
                          ? form.finalAmount
                          : 0
                        ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            {/* Installment Breakdown */}
                {form.installment > 1 && !readOnly && (
                  <div className="bg-blue-50 p-4 rounded-lg mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  Installment Breakdown
                </h3>
                <div className="space-y-3">
                  {installments.map((installment, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="font-medium">Installment {installment.installmentNumber || index + 1}</span>
                      <div className="text-right">
                        <span className="font-semibold text-blue-600">₹{installment.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
              </div>
            )}

            {/* Reference Information */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Reference Information</h2>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reference By</label>
                <Select
                  name="reference"
                  options={[
                    { value: 'Banner', label: 'Banner' },
                    { value: 'Pamphlet', label: 'Pamphlet' },
                    { value: 'Social Media', label: 'Social Media' },
                    { value: 'Friends', label: 'Friends' },
                    { value: 'Institute', label: 'Institute' },
                    { value: 'Other', label: 'Other' },
                  ]}
                  value={
                    form.reference
                      ? { value: form.reference, label: form.reference }
                      : null
                  }
                  onChange={option => setForm(f => ({ ...f, reference: option ? option.value : '' }))}
                  placeholder="How did you hear about us?"
                  isClearable
                  isDisabled={readOnly}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      minHeight: '48px',
                      borderRadius: '0.75rem',
                      borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
                      boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 1px 2px 0 #e5e7eb',
                      '&:hover': { borderColor: '#2563eb' },
                      fontSize: '1rem',
                      backgroundColor: '#f8fafc',
                      cursor: readOnly ? 'not-allowed' : 'pointer',
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: '#64748b',
                      fontSize: '1rem',
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 50,
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 24px 0 #00000011',
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      marginTop: 4,
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? '#8b5cf6'
                        : state.isFocused
                        ? '#f3f4f6'
                        : '#fff',
                      color: '#0f172a',
                      fontWeight: state.isSelected ? 600 : 400,
                      borderRadius: '0.5rem',
                      padding: '6px 16px',
                      cursor: readOnly ? 'not-allowed' : 'pointer',
                    }),
                    dropdownIndicator: (base, state) => ({
                      ...base,
                      color: state.isFocused ? '#2563eb' : '#64748b',
                      '&:hover': { color: '#2563eb' },
                    }),
                    indicatorSeparator: () => ({ display: 'none' }),
                  }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Inquiry By</label>
                  <input type="text" name="inquiryBy" value={form.inquiryBy || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Inquiry Date</label>
                  <input type="date" name="inquiryDate" value={form.inquiryDate || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={readOnly} readOnly={readOnly} style={readOnly ? { cursor: 'not-allowed' } : {}} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Enquiry Type</label>
                  <select 
                    name="enquiryType" 
                    value={form.enquiryType || 'Enquiry'} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    disabled={readOnly}
                    style={readOnly ? { cursor: 'not-allowed' } : {}}
                  >
                    <option value="Enquiry">Enquiry</option>
                    <option value="Admission">Admission</option>
                  </select>
                  {errors.enquiryType && <div className="text-red-500 text-sm mt-1">{errors.enquiryType}</div>}
                </div>
                {/* Admission Date - Only show and required when Enquiry Type is "Admission" */}
                {form.enquiryType === 'Admission' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Admission Date <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="date" 
                      name="date" 
                      value={form.date || ''} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      disabled={readOnly} 
                      readOnly={readOnly} 
                      style={readOnly ? { cursor: 'not-allowed' } : {}}
                      required={form.enquiryType === 'Admission'}
                    />
                    {errors.date && <div className="text-red-500 text-sm mt-1">{errors.date}</div>}
                  </div>
                )} 
              </div>
            </div>

            {/* Submit Button */}
            {!readOnly && (
            <div className="flex justify-center pt-6 no-print gap-3">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-lg font-bold text-lg shadow-md transition-all flex items-center justify-center min-w-[180px]" disabled={loading}>
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    {editingStudent ? "Updating..." : "Registering..."}
                  </>
                ) : (
                  editingStudent ? "Update Student" : "Register Student"
                )}
                </button>
              <button type="button" onClick={handlePrint} className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-md transition-all flex items-center justify-center min-w-[140px]">
                Print
              </button>
            </div>
            )}
            {success && <div className="text-green-600 text-center mt-4">{success}</div>}
            {error && <div className="text-red-600 text-center mt-4">{error}</div>}
          </form>
          {/* Print-only summary view */}
          <div className="print-only p-8 text-sm">
            <div className="mb-6">
              <div className="flex flex-col items-start mb-4 pt-[20px] pl-[20px]">
                <img 
                  src="/TCIT Logo png.png" 
                  alt="TCIT Logo" 
                  className="w-[170px] h-[50px] object-contain mb-2"
                />
                <h1 className="text-sm font-bold text-gray-900 mt-[10px]">TALENT COMPUTER INSTITUTE</h1>
              </div>
              <div className="mb-4 relative mt-4">
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-14">Inquiry Form</h2>
                <div className="absolute top-0 right-0 flex flex-col items-center pr-[20px]">
                  <span className="text-xs font-semibold mb-1">Student Photo</span>
                  <Avatar
                    src={imagePreview}
                    name={form.name}
                    size="2xl"
                    className="border print-photo"
                  />
                </div>
              </div>
            </div>
            <div className="print-summary-box">
              <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-blue-700 mb-2">Basic Details</h3>
                  <div className="print-field-grid">
                    <div className="print-field-row"><span className="print-field-label">Form No:</span> {form.formNo || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">Date:</span> {form.date || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">Student ID:</span> {form.studentId || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">Name:</span> {form.name || '-'} {form.surname || ''}</div>
                    <div className="print-field-row"><span className="print-field-label">Father/Husband Name:</span> {form.fatherHusbandName || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">Father Name:</span> {form.fatherName || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">Mother Name:</span> {form.motherName || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">DOB:</span> {formatDateOnly(form.dob) || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">Gender:</span> {form.gender || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">Education:</span> {form.educationLevel || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">School/College:</span> {form.schoolCollegeName || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">Aadhar:</span> {form.aadhar || '-'}</div>
                  </div>
              </div>
              <div>
                <h3 className="font-semibold text-blue-700 mb-2">Contact & Address</h3>
                  <div className="print-field-grid">
                    <div className="print-field-row" style={{ gridColumn: 'span 2 / span 2' }}><span className="print-field-label">Address:</span> {form.address || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">Area:</span> {form.area || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">City:</span> {form.city || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">Pin Code:</span> {form.pinCode || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">Contact No:</span> {form.contactNo || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">Father No:</span> {form.fatherNo || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">Home Contact:</span> {form.homeContact || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">Email:</span> {form.email || '-'}</div>
                  </div>
              </div>
              <div>
                <h3 className="font-semibold text-blue-700 mb-2">Course Information</h3>
                {selectedCourseDetails.length > 0 ? (
                    <div className="space-y-1">
                      {selectedCourseDetails.map((c, idx) => (
                        <div key={idx} className="print-field-row flex justify-between">
                          <span>{idx + 1}. {c.name}</span>
                          <span>₹{c.fee.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                ) : (
                  <div>-</div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-blue-700 mb-2">Fee Summary</h3>
                  <div className="space-y-1">
                    <div className="print-field-row flex justify-between"><span>Total Course Price</span><span>₹{(form.totalPrice || calculateTotalPrice()).toLocaleString()}</span></div>
                    <div className="print-field-row flex justify-between"><span>Discount</span><span>{form.discount || 0}%</span></div>
                    <div className="print-field-row flex justify-between"><span>Final Amount</span><span>₹{(form.totalFees || 0).toLocaleString()}</span></div>
                    <div className="print-field-row flex justify-between"><span>Installments</span><span>{form.installment}</span></div>
                  </div>
                {Array.isArray(installments) && installments.length > 0 && (
                  <div className="mt-2">
                      {installments.map((ins, i) => (
                        <div key={i} className="print-field-row flex justify-between text-xs">
                          <span>Installment {ins.installmentNumber || i + 1}</span>
                          <span>₹{Number(ins.amount || 0).toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-blue-700 mb-2">Reference</h3>
                  <div className="print-field-grid">
                    <div className="print-field-row"><span className="print-field-label">Reference By:</span> {form.reference || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">Inquiry By:</span> {form.inquiryBy || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">Inquiry Date:</span> {form.inquiryDate || '-'}</div>
                    <div className="print-field-row"><span className="print-field-label">Enquiry Type:</span> {form.enquiryType || '-'}</div>
                  </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marksheet Preview Dialog */}
      {openMarksheetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="relative w-[60vw] h-screen mx-auto my-0 flex items-center justify-center">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10 bg-white bg-opacity-70 rounded-full p-2"
              onClick={() => setOpenMarksheetDialog(null)}
            >
              Close
            </button>
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              {getFileType(openMarksheetDialog) === 'image' ? (
                <img
                  ref={imgRef}
                  src={openMarksheetDialog.url || (openMarksheetDialog instanceof File ? URL.createObjectURL(openMarksheetDialog) : openMarksheetDialog)}
                  alt={openMarksheetDialog.name || 'Marksheet'}
                  style={{ height: '100%', width: '100%', display: 'block', objectFit: 'contain', WebkitUserSelect: 'none' }}
                />
              ) : (
                <iframe
                  src={openMarksheetDialog.url || (openMarksheetDialog instanceof File ? URL.createObjectURL(openMarksheetDialog) : openMarksheetDialog)}
                  title={openMarksheetDialog.name || 'Marksheet PDF'}
                  className="w-full h-full"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentForm; 