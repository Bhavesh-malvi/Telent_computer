import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Users, UserPlus } from 'lucide-react';

const StudentChart = ({ data, title, loading = false }) => {
  // Card metrics
  // For Total Students: show overall total (all time), not filtered period total
  const overallTotalStudents = data.length > 0 ? (data[0]?.overallTotalStudents || 0) : 0;
  
  // Fallback: if overallTotalStudents is 0, use the cumulative total from the chart data
  const displayTotalStudents = overallTotalStudents > 0 ? overallTotalStudents : 
    (data.length > 0 ? data[data.length - 1]?.totalStudents || 0 : 0);



  // New enrollments: show total for the period (year or month)
  const totalNewEnrollmentsPeriod = data.reduce((sum, item) => sum + (item.newEnrollments || 0), 0);

  // For charts/other calculations
  const avgGrowth = data.length > 1 && data[0].totalStudents > 0 ?
    ((data[data.length - 1].totalStudents - data[0].totalStudents) / data[0].totalStudents * 100) : 0;

  return (
    <div className="bg-white  rounded-xl shadow-sm border border-gray-200  p-6 relative">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl z-10">
          <div className="text-blue-600">Updating data...</div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900  flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600 " />
            <span>{title}</span>
          </h3>
          <p className="text-sm text-gray-600  mt-1">Student enrollment trends over time</p>
        </div>
        
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-green-500 " />
              <span className="text-sm font-medium text-gray-600 ">Growth</span>
            </div>
            <p className="text-lg font-bold text-green-600 ">{avgGrowth.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50  rounded-lg p-4 ">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600 " />
            <span className="text-sm font-medium text-blue-700 ">Total Students</span>
          </div>
          <p className="text-2xl font-bold text-blue-900  mt-1">{displayTotalStudents.toLocaleString()}</p>
        </div>
        
        <div className="bg-green-50  rounded-lg p-4 ">
          <div className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-green-600 " />
            <span className="text-sm font-medium text-green-700 ">New Enrollments</span>
          </div>
          <p className="text-2xl font-bold text-green-900  mt-1">{totalNewEnrollmentsPeriod.toLocaleString()}</p>
        </div>
        
        <div className="bg-purple-50  rounded-lg p-4 ">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 ">Avg. Monthly</span>
          </div>
          <p className="text-2xl font-bold text-purple-900  mt-1">{data.length > 0 ? Math.round(totalNewEnrollmentsPeriod / data.length) : 0}</p>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="totalStudents" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              name="Total Students"
            />
            <Line 
              type="monotone" 
              dataKey="newEnrollments" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2 }}
              name="New Enrollments"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StudentChart;