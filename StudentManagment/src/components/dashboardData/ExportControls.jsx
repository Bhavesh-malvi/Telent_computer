import React from 'react';
import { Download, FileSpreadsheet, BarChart3, Users, DollarSign, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


const monthNames = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getMonthName(value) {
  if (typeof value === 'string') {
    // If the backend already sent a human-readable month name, use it
    if (monthNames.includes(value)) return value;
    // If stringified number, parse to number
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 12) return monthNames[parsed];
    return value;
  }
  if (typeof value === 'number' && value >= 1 && value <= 12) return monthNames[value];
  return value ?? '';
}

const ExportControls = ({ 
  studentData, 
  courseData, 
  feeData, 
  dailyPayments, 
  pendingPayments, 
  filters 
}) => {
  const handleExportStudentData = () => {
    exportStudentDataToExcel(studentData, filters);
  };

  const handleExportCourseData = () => {
    exportCourseDataToExcel(courseData, filters);
  };

  const handleExportFeeData = () => {
    exportFeeDataToExcel(feeData, filters);
  };

  const handleExportDailyPayments = () => {
    exportDailyPaymentsToExcel(dailyPayments, pendingPayments);
  };

  // Removed combined report export

  return (
    <div className="bg-white  rounded-xl shadow-sm border border-gray-200  p-6 mb-6 ">
      <div className="flex items-center space-x-2 mb-4">
        <Download className="h-5 w-5 text-gray-600 " />
        <h3 className="text-lg font-semibold text-gray-900 ">Export Reports</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={handleExportStudentData}
          className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors duration-200 group"
        >
          <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h4 className="font-medium text-blue-900">Student Data</h4>
            <p className="text-sm text-blue-700">Export enrollment trends</p>
          </div>
          <FileSpreadsheet className="h-4 w-4 text-blue-600 ml-auto" />
        </button>

        <button
          onClick={handleExportCourseData}
          className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors duration-200 group"
        >
          <div className="bg-green-600 p-2 rounded-lg group-hover:bg-green-700 transition-colors">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h4 className="font-medium text-green-900">Course Data</h4>
            <p className="text-sm text-green-700">Export demand analytics</p>
          </div>
          <FileSpreadsheet className="h-4 w-4 text-green-600 ml-auto" />
        </button>

        <button
          onClick={handleExportFeeData}
          className="flex items-center space-x-3 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors duration-200 group"
        >
          <div className="bg-emerald-600 p-2 rounded-lg group-hover:bg-emerald-700 transition-colors">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h4 className="font-medium text-emerald-900">Fee Revenue</h4>
            <p className="text-sm text-emerald-700">Export revenue data</p>
          </div>
          <FileSpreadsheet className="h-4 w-4 text-emerald-600 ml-auto" />
        </button>

        <button
          onClick={handleExportDailyPayments}
          className="flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors duration-200 group"
        >
          <div className="bg-orange-600 p-2 rounded-lg group-hover:bg-orange-700 transition-colors">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h4 className="font-medium text-orange-900">Daily Payments</h4>
            <p className="text-sm text-orange-700">Export payment records</p>
          </div>
          <FileSpreadsheet className="h-4 w-4 text-orange-600 ml-auto" />
        </button>

        {/** Complete Report export removed as requested */}
      </div>

      <div className="mt-4 p-3 bg-gray-50  rounded-lg ">
        <p className="text-sm text-gray-600 ">
          <strong>Current Filter:</strong> {filters.selectedMonth === 'All' ? 'All Months' : getMonthName(filters.selectedMonth)} {filters.selectedYear}
          <span className="ml-2 text-gray-500 ">• Excel files will include filtered data with summary statistics</span>
        </p>
      </div>
    </div>
  );
};

function exportStudentDataToExcel(data, filters) {
  const sanitized = (data || []).map(item => ({
    Year: item.year ?? '',
    Month: getMonthName(item.month ?? item.monthNumber),
    'Total Students': item.totalStudents ?? 0,
    'New Enrollments': item.newEnrollments ?? 0,
  }));
  const ws = XLSX.utils.json_to_sheet(sanitized);
  
  // Set column widths based on content
  const colWidths = [
    { wch: Math.max(4, Math.max(...sanitized.map(row => String(row.Year).length))) }, // Year
    { wch: Math.max(5, Math.max(...sanitized.map(row => String(row.Month).length))) }, // Month
    { wch: Math.max(13, Math.max(...sanitized.map(row => String(row['Total Students']).length))) }, // Total Students
    { wch: Math.max(15, Math.max(...sanitized.map(row => String(row['New Enrollments']).length))) }, // New Enrollments
  ];
  ws['!cols'] = colWidths;
  
  // Center align all cells
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cell_address]) continue;
      if (!ws[cell_address].s) ws[cell_address].s = {};
      ws[cell_address].s.alignment = { horizontal: 'center', vertical: 'center' };
    }
  }
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Student Data");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const monthPart = filters.selectedMonth === 'All' ? 'All' : getMonthName(filters.selectedMonth);
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), `StudentData_${filters.selectedYear}_${monthPart}.xlsx`);
}

function exportCourseDataToExcel(data, filters) {
  const sanitized = (data || []).map(item => ({
    Year: item.year ?? '',
    Month: getMonthName(item.month),
    'Course Name': item.courseName ?? '',
    Enrollments: item.enrollments ?? item.count ?? 0,
  }));
  const ws = XLSX.utils.json_to_sheet(sanitized);
  
  // Set column widths based on content with better minimum widths
  const colWidths = [
    { wch: Math.max(6, Math.max(...sanitized.map(row => String(row.Year).length))) }, // Year
    { wch: Math.max(8, Math.max(...sanitized.map(row => String(row.Month).length))) }, // Month
    { wch: Math.max(35, Math.max(...sanitized.map(row => String(row['Course Name']).length))) }, // Course Name - increased width
    { wch: Math.max(12, Math.max(...sanitized.map(row => String(row.Enrollments).length))) }, // Enrollments
  ];
  ws['!cols'] = colWidths;
  
  // Center align all cells including headers and data
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cell_address]) continue;
      if (!ws[cell_address].s) ws[cell_address].s = {};
      ws[cell_address].s.alignment = { horizontal: 'center', vertical: 'center' };
    }
  }
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Course Data");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const monthPart = filters.selectedMonth === 'All' ? 'All' : getMonthName(filters.selectedMonth);
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), `CourseData_${filters.selectedYear}_${monthPart}.xlsx`);
}

function exportFeeDataToExcel(data, filters) {
  const sanitized = (data || []).map(item => ({
    Year: item.year ?? item._id?.year ?? '',
    Month: getMonthName(item.month ?? item._id?.month ?? item.monthNumber),
    'Total Revenue': item.totalRevenue ?? item.totalAmount ?? 0,
    'Students (Cumulative)': item.studentsCount ?? 0,
  }));
  const ws = XLSX.utils.json_to_sheet(sanitized);
  
  // Set column widths based on content
  const colWidths = [
    { wch: Math.max(4, Math.max(...sanitized.map(row => String(row.Year).length))) }, // Year
    { wch: Math.max(5, Math.max(...sanitized.map(row => String(row.Month).length))) }, // Month
    { wch: Math.max(13, Math.max(...sanitized.map(row => String(row['Total Revenue']).length))) }, // Total Revenue
    { wch: Math.max(20, Math.max(...sanitized.map(row => String(row['Students (Cumulative)']).length))) }, // Students (Cumulative)
  ];
  ws['!cols'] = colWidths;
  
  // Center align all cells
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cell_address]) continue;
      if (!ws[cell_address].s) ws[cell_address].s = {};
      ws[cell_address].s.alignment = { horizontal: 'center', vertical: 'center' };
    }
  }
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Fee Revenue");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const monthPart = filters.selectedMonth === 'All' ? 'All' : getMonthName(filters.selectedMonth);
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), `FeeRevenue_${filters.selectedYear}_${monthPart}.xlsx`);
}

function exportDailyPaymentsToExcel(dailyPayments, pendingPayments) {
  const wb = XLSX.utils.book_new();
  
  // Daily Payments sheet with column widths
  const dailyWs = XLSX.utils.json_to_sheet(dailyPayments);
  if (dailyPayments.length > 0) {
    const dailyCols = Object.keys(dailyPayments[0]).map(key => ({
      wch: Math.max(key.length, Math.max(...dailyPayments.map(row => String(row[key] || '').length)))
    }));
    dailyWs['!cols'] = dailyCols;
    
    // Center align all cells in daily payments sheet
    const dailyRange = XLSX.utils.decode_range(dailyWs['!ref']);
    for (let R = dailyRange.s.r; R <= dailyRange.e.r; ++R) {
      for (let C = dailyRange.s.c; C <= dailyRange.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!dailyWs[cell_address]) continue;
        if (!dailyWs[cell_address].s) dailyWs[cell_address].s = {};
        dailyWs[cell_address].s.alignment = { horizontal: 'center', vertical: 'center' };
      }
    }
  }
  
  // Pending Payments sheet with column widths
  const pendingWs = XLSX.utils.json_to_sheet(pendingPayments);
  if (pendingPayments.length > 0) {
    const pendingCols = Object.keys(pendingPayments[0]).map(key => ({
      wch: Math.max(key.length, Math.max(...pendingPayments.map(row => String(row[key] || '').length)))
    }));
    pendingWs['!cols'] = pendingCols;
    
    // Center align all cells in pending payments sheet
    const pendingRange = XLSX.utils.decode_range(pendingWs['!ref']);
    for (let R = pendingRange.s.r; R <= pendingRange.e.r; ++R) {
      for (let C = pendingRange.s.c; C <= pendingRange.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!pendingWs[cell_address]) continue;
        if (!pendingWs[cell_address].s) pendingWs[cell_address].s = {};
        pendingWs[cell_address].s.alignment = { horizontal: 'center', vertical: 'center' };
      }
    }
  }
  
  XLSX.utils.book_append_sheet(wb, dailyWs, "Daily Payments");
  XLSX.utils.book_append_sheet(wb, pendingWs, "Pending Payments");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), "DailyAndPendingPayments.xlsx");
}

// Complete Report export function removed

export default ExportControls;