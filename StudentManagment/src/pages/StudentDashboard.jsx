import React, { useState, useEffect } from 'react';
import Header from '../components/dashboardData/Header';
import FilterControls from '../components/dashboardData/FilterControls';
import ExportControls from '../components/dashboardData/ExportControls';
import StudentChart from '../components/dashboardData/StudentChart';
import CourseChart from '../components/dashboardData/CourseChart';
import FeeRevenueChart from '../components/dashboardData/FeeRevenueChart';
import DailyPayments from '../components/dashboardData/DailyPayments';
import API_CONFIG from '../config/apiConfig.js';
// import { studentData, courseData, feeData, dailyPayments, pendingPayments } from '../components/dashboardData/data/mockData';

const monthNames = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function StudentDashboard() {
  const [filters, setFilters] = useState({
    selectedYear: 2025, // Set default to 2025 to match your data
    selectedMonth: 'All'
  });

  // Custom filter change handler to ensure month resets when year changes
  const handleFilterChange = (newFilters) => {
    // If year changed, reset month to "All"
    if (newFilters.selectedYear !== filters.selectedYear) {
      newFilters.selectedMonth = "All";
    }
    setFilters(newFilters);
  };

  // States for API data
  const [studentData, setStudentData] = useState([]);
  const [courseData, setCourseData] = useState([]);
  const [feeData, setFeeData] = useState([]);
  const [dailyPayments, setDailyPayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true); // initial page load only
  const [courseLoading, setCourseLoading] = useState(false);
  const [studentDataLoading, setStudentDataLoading] = useState(false);
  const [error, setError] = useState(null);

  const BASE_URL = API_CONFIG.BASE_URL;
  // const BASE_URL = "https://telent-computer-uykj.vercel.app";

  // Initial data fetch only once
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [studentRes, feeRes, dailyRes, pendingRes] = await Promise.all([
          fetch(`${BASE_URL}/api/dashboard/monthly-enrollments?year=${filters.selectedYear}&month=${filters.selectedMonth}`),
          fetch(`${BASE_URL}/api/dashboard/monthly-fee-revenue`),
          fetch(`${BASE_URL}/api/dashboard/todays-payments`),
          fetch(`${BASE_URL}/api/dashboard/pending-installments`)
        ]);

        const [studentJson, feeJson, dailyJson, pendingJson] = await Promise.all([
          studentRes.json(),
          feeRes.json(),
          dailyRes.json(),
          pendingRes.json()
        ]);

        // Ensure all data is arrays to prevent mapping errors
        setStudentData(Array.isArray(studentJson) ? studentJson : []);
        setFeeData(Array.isArray(feeJson) ? feeJson : []);
        setDailyPayments(Array.isArray(dailyJson) ? dailyJson : []);
        setPendingPayments(Array.isArray(pendingJson) ? pendingJson : []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []); // Only run once on mount

  // Separate effect for student data updates when filters change
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setStudentDataLoading(true);
        const studentRes = await fetch(`${BASE_URL}/api/dashboard/monthly-enrollments?year=${filters.selectedYear}&month=${filters.selectedMonth}`);
        const studentJson = await studentRes.json();
        setStudentData(Array.isArray(studentJson) ? studentJson : []);
      } catch (err) {
        console.error('Student data fetch error:', err);
      } finally {
        setStudentDataLoading(false);
      }
    };
    
    // Only fetch if not initial load
    if (!loading) {
      fetchStudentData();
    }
  }, [filters.selectedYear, filters.selectedMonth, loading]);

  // Fetch only course demand when filters change
  useEffect(() => {
    const fetchCourseDemand = async () => {
      try {
        setCourseLoading(true);
        const courseRes = await fetch(`${BASE_URL}/api/dashboard/course-demand?year=${filters.selectedYear}&month=${filters.selectedMonth}`);
        const courseJson = await courseRes.json();
        setCourseData(Array.isArray(courseJson) ? courseJson : []);
      } catch (err) {
        console.error('Course demand fetch error:', err);
      } finally {
        setCourseLoading(false);
      }
    };
    
    // Only fetch if not initial load
    if (!loading) {
      fetchCourseDemand();
    }
  }, [filters.selectedYear, filters.selectedMonth, loading]);

  // Data mapping for charts
  const mappedStudentData = studentData.map(item => ({
    year: item._id?.year,
    month: monthNames[item._id?.month],
    monthNumber: item._id?.month, // Add month number for debugging
    totalStudents: item.totalStudents || 0,
    newEnrollments: item.newEnrollments || 0,
    overallTotalStudents: item.overallTotalStudents || 0 // Include overall total
  }));

  const filteredStudentData = mappedStudentData.filter(item => {
    const yearMatch = item.year === filters.selectedYear;
    const monthMatch = filters.selectedMonth === 'All' || 
      (filters.selectedMonth !== 'All' && item.monthNumber === parseInt(filters.selectedMonth));
    
    
    return yearMatch && monthMatch;
  });


  // Normalize course names to group similar courses together
  const normalizeCourseName = (name) => {
    if (!name) return '';
    return name.toLowerCase().trim();
  };

  // Group courses by normalized name and sum enrollments
  const courseDataMap = new Map();
  
  courseData.forEach(item => {
    const normalizedName = normalizeCourseName(item.courseName);
    const displayName = item.courseName || 'Unknown Course';
    
    if (courseDataMap.has(normalizedName)) {
      // Add to existing course
      const existing = courseDataMap.get(normalizedName);
      existing.enrollments += item.count || 0;
    } else {
      // Create new course entry
      courseDataMap.set(normalizedName, {
        courseName: displayName,
        enrollments: item.count || 0,
        year: item.year,
        month: item.month
      });
    }
  });

  const mappedCourseData = Array.from(courseDataMap.values());
  

  
  
  const filteredCourseData = mappedCourseData.filter(item => {
    const yearMatch = item.year === filters.selectedYear;
    const monthMatch = filters.selectedMonth === 'All' ||
      (filters.selectedMonth !== 'All' && item.month === parseInt(filters.selectedMonth));
    
    return yearMatch && monthMatch;
  });


  const mappedFeeData = feeData.map(item => ({
    year: item._id?.year,
    month: monthNames[item._id?.month],
    monthNumber: item._id?.month, // Add month number for filtering
    totalRevenue: typeof item.totalAmount === 'number' ? item.totalAmount : 0,
    studentsCount: typeof item.studentsCount === 'number' ? item.studentsCount : 0
  }));

  // Calculate cumulative students count
  let cumulativeStudents = 0;
  const mappedFeeDataWithCumulative = mappedFeeData.map(item => {
    cumulativeStudents += item.studentsCount;
    return {
      ...item,
      studentsCount: cumulativeStudents
    };
  });

  const filteredFeeData = mappedFeeDataWithCumulative.filter(item => {
    const yearMatch = item.year === filters.selectedYear;
    const monthMatch = filters.selectedMonth === 'All' || 
      (filters.selectedMonth !== 'All' && item.monthNumber === parseInt(filters.selectedMonth));
    return yearMatch && monthMatch;
  });

  const studentChartTitle = `Student Enrollment ${filters.selectedMonth === 'All' ? 'Yearly' : 'Monthly'} Overview (${filters.selectedYear})`;
  const courseChartTitle = `Course Demand Analysis ${filters.selectedMonth === 'All' ? '(Year)' : `(${filters.selectedMonth})`} - ${filters.selectedYear}`;
  const feeChartTitle = `Fee Revenue ${filters.selectedMonth === 'All' ? 'Yearly' : 'Monthly'} Analysis (${filters.selectedYear})`;

  if (loading) return <div className="p-8 text-center  ">Loading dashboard data...</div>;
  if (error) return <div className="p-8 text-center text-red-600  ">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50  transition-colors duration-300">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900  mb-2 transition-colors duration-300">Analytics Dashboard</h2>
          <p className="text-gray-600  transition-colors duration-300">Track student enrollment trends and course popularity metrics</p>
        </div>
        <FilterControls filters={filters} onFilterChange={handleFilterChange} />
        <ExportControls 
          studentData={filteredStudentData}
          courseData={filteredCourseData}
          feeData={filteredFeeData}
          dailyPayments={dailyPayments}
          pendingPayments={pendingPayments}
          filters={filters}
        />
        <div className="space-y-8">
          <StudentChart 
            data={filteredStudentData} 
            title={studentChartTitle}
            loading={studentDataLoading}
          />
          <CourseChart 
            data={filteredCourseData} 
            title={courseChartTitle}
            loading={courseLoading}
          />
          <FeeRevenueChart 
            data={filteredFeeData} 
            title={feeChartTitle}
          />
          <DailyPayments 
            dailyPayments={dailyPayments}
            pendingPayments={pendingPayments}
          />
        </div>
      </main>
    </div>
  );
}

export default StudentDashboard; 