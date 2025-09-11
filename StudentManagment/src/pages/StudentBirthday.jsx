import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Gift, Star, Heart, Calendar, Phone, Mail, CheckCircle, XCircle, Clock } from "react-feather";
import Avatar from "../components/Avatar";

const birthdayWishTemplate = "🎉 Happy Birthday {name}! 🎂 Wishing you a fantastic day filled with joy, laughter, and all your favorite things! May this new year bring you amazing adventures, endless happiness, and continued success in your studies. You're such an incredible student and we're so proud of you! Have a wonderful celebration! 🎈✨";

function generateBirthdayWish(name) {
  return birthdayWishTemplate.replace("{name}", name);
}

const StudentBirthday = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wishStats, setWishStats] = useState({ sent: 0, failed: 0, total: 0 });

  // Fetch birthday students data
  const fetchBirthdayStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/students/birthday');
      setStudents(response.data || []);
      
      // Calculate wish statistics
      const stats = {
        sent: response.data.filter(s => s.wishStatus === 'sent').length,
        failed: response.data.filter(s => s.wishStatus === 'failed').length,
        total: response.data.length
      };
      setWishStats(stats);
      
      setError("");
    } catch (err) {
      setError("Failed to fetch birthday students. Please try again.");
      console.error("Error fetching birthday students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBirthdayStudents();
    
    // Auto-refresh every 30 seconds to get real-time wish status
    const interval = setInterval(() => {
      fetchBirthdayStudents();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <Gift className="animate-bounce text-pink-400 mx-auto mb-4" size={48} />
          <p className="text-xl font-semibold text-gray-700">Loading birthday students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-8 px-4">
      {/* Floating decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 text-pink-300 animate-bounce">
          <Gift size={24} />
        </div>
        <div className="absolute top-20 right-20 text-purple-300 animate-pulse">
          <Star size={20} />
        </div>
        <div className="absolute bottom-20 left-20 text-indigo-300 animate-bounce delay-300">
          <Heart size={22} />
        </div>
        <div className="absolute bottom-10 right-10 text-pink-300 animate-pulse delay-500">
          <Gift size={26} />
        </div>
        <div className="absolute top-1/2 left-5 text-purple-300 animate-float">
          <Star size={18} />
        </div>
        <div className="absolute top-1/3 right-5 text-pink-300 animate-float delay-700">
          <Gift size={20} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Gift className="text-pink-500" size={40} />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
              Student Birthdays
            </h1>
            <Gift className="text-pink-500" size={40} />
          </div>
          <p className="text-gray-600 text-xl">Celebrating our amazing students!</p>
                     <div className="mt-4 inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
             <Star className="text-yellow-500" size={20} />
             <span className="text-gray-700 font-medium">{students.length} Students Celebrating</span>
           </div>
           
                       {/* System Status and Wish Statistics */}
            <div className="mt-6 flex items-center justify-center gap-6">
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
                <CheckCircle className="text-green-600" size={16} />
                <span className="text-green-700 text-sm font-medium">Automatic Birthday Wishes System Active</span>
              </div>
              
              <div className="text-sm text-gray-600 flex items-center gap-4">
                <span>📊 Today's Wish Statistics:</span>
                <span>✅ Sent: {wishStats.sent} students</span>
                <span>❌ Failed: {wishStats.failed} students</span>
                <span>📋 Total: {wishStats.total} students</span>
                <button 
                  onClick={fetchBirthdayStudents}
                  className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          

        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center text-red-600 mb-6">
            <span>⚠️ {error}</span>
            <button onClick={fetchBirthdayStudents} className="ml-4 px-4 py-2 bg-pink-500 text-white rounded-lg">Retry</button>
          </div>
        )}

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {students.map((student) => (
            <div key={student._id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-pink-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              {/* Card Header */}
              <div className="relative bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 px-6 py-8">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <Avatar
                      src={student.image}
                      name={student.name}
                      size="2xl"
                      className="border-4 border-white shadow-lg"
                    />
                    <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1.5 shadow-lg animate-pulse">
                      <Star className="text-yellow-700" size={14} />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">{student.name}</h2>
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
                    <Calendar size={14} />
                    <span className="font-medium">{new Date(student.dob).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                {/* Contact Information */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-100">
                    <div className="bg-pink-500 p-1.5 rounded-lg">
                      <Phone className="text-white" size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-500 text-xs font-medium">Phone</p>
                      <p className="text-gray-800 font-semibold text-sm truncate">{student.contactNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                    <div className="bg-purple-500 p-1.5 rounded-lg">
                      <Mail className="text-white" size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-500 text-xs font-medium">Email</p>
                      <p className="text-gray-800 font-semibold text-sm truncate">{student.email}</p>
                    </div>
                  </div>
                </div>

                {/* Birthday Wish */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Gift className="text-pink-500" size={16} />
                    Birthday Wish
                  </h3>
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-100">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {generateBirthdayWish(student.name)}
                    </p>
                  </div>
                </div>

                {/* Wish Status */}
                <div className="text-center">
                  {student.wishStatus === 'sent' ? (
                    <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
                      <CheckCircle className="text-green-600" size={16} />
                      <span className="text-green-700 text-sm font-medium">Wish Sent</span>
                    </div>
                  ) : student.wishStatus === 'failed' ? (
                    <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-2">
                      <XCircle className="text-red-600" size={16} />
                      <span className="text-red-700 text-sm font-medium">Failed</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-2">
                      <Clock className="text-yellow-600" size={16} />
                      <span className="text-yellow-700 text-sm font-medium">Pending</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-500">
            Made with <Heart className="inline text-pink-500" size={16} /> for our amazing students
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentBirthday; 