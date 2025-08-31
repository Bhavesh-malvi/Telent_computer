import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BookOpen, Award, Star } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CourseChart = ({ data, title }) => {
  // Check if data is empty or undefined
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <span>{title}</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">Most popular courses by enrollment</p>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">
          No course data available for the selected filters.
        </div>
      </div>
    );
  }

  const totalEnrollments = data.reduce((sum, item) => sum + (item.enrollments || 0), 0);
  const topCourse = data.reduce((prev, current) => 
    ((prev.enrollments || 0) > (current.enrollments || 0)) ? prev : current, data[0]
  );
  const avgEnrollments = data.length > 0 ? Math.round(totalEnrollments / data.length) : 0;

  // Shorten very long names for bar labels, but keep full names in tooltip/pie labels
  const shorten = (name) => {
    if (!name) return '';
    return name.length > 24 ? name.slice(0, 24) + '…' : name;
  };

  const chartData = data.slice(0, 6).map((course, index) => ({
    ...course,
    courseLabel: shorten(course.courseName),
    fill: COLORS[index % COLORS.length]
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-green-600" />
            <span>{title}</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">Most popular courses by enrollment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Top Course</span>
          </div>
          <p className="text-lg font-bold text-orange-900 mt-1">{topCourse.courseName}</p>
          <p className="text-sm text-orange-700">{topCourse.enrollments} students</p>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Total Enrollments</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-1">{totalEnrollments.toLocaleString()}</p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Avg. Per Course</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 mt-1">{avgEnrollments}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[0.8fr,1.2fr] gap-3">
        <div className="h-80 lg:max-w-[520px]">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Enrollment by Course</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                type="number"
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                type="category"
                dataKey="courseLabel" 
                stroke="#6b7280"
                fontSize={12}
                 width={180}
                interval={0}
              />
               <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                 }}
                 formatter={(value, name, props) => {
                   if (name === 'enrollments') {
                     return [value, props?.payload?.courseName || 'Enrollments'];
                   }
                   return [value, name];
                 }}
              />
              <Bar 
                dataKey="enrollments" 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="h-80">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Course Distribution</h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="enrollments"
                label={({ courseName, percent }) => `${courseName} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CourseChart;