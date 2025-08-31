import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Calculator, CreditCard } from 'lucide-react';

const FeeRevenueChart = ({ data, title }) => {
  const totalRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalStudents = data.reduce((sum, item) => sum + item.studentsCount, 0);
  const avgRevenuePerMonth = data.length > 0 ? Math.round(totalRevenue / data.length) : 0;
  const avgRevenueGrowth = data.length > 1 && data[0].totalRevenue !== 0
    ? ((data[data.length - 1].totalRevenue - data[0].totalRevenue) / data[0].totalRevenue * 100)
    : 0;
  const avgFeePerStudent = totalStudents > 0 ? Math.round(totalRevenue / totalStudents) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            
            <span>₹ {title}</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">Fee collection and revenue analytics</p>
        </div>
        
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-600">Growth</span>
            </div>
            <p className="text-lg font-bold text-green-600">{avgRevenueGrowth.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-green-700">₹ Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-1">₹{totalRevenue.toLocaleString()}</p>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Avg. Monthly</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-1">₹{avgRevenuePerMonth.toLocaleString()}</p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Paying Students</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 mt-1">{totalStudents.toLocaleString()}</p>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Avg. Fee/Student</span>
          </div>
          <p className="text-2xl font-bold text-orange-900 mt-1">₹{avgFeePerStudent}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Revenue Trend</h4>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="totalRevenue" 
                stroke="#10b981" 
                fill="url(#revenueGradient)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="h-80">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Students vs Revenue</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
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
              <Bar 
                dataKey="studentsCount" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name="Students Count"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default FeeRevenueChart;