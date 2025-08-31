import React, { useState, useEffect } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import { Upload, Image as ImageIcon, ArrowLeft, Save, Plus } from "react-feather";

const CourseForm = ({ onSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const editCourse = location.state?.course;

  const [name, setName] = useState("");
  const [fees, setFees] = useState("");
  const [duration, setDuration] = useState("");
  const [badge, setBadge] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (editCourse) {
      setName(editCourse.name || "");
      setFees(editCourse.fees ? editCourse.fees.toString() : "");
      setDuration(editCourse.duration || "");
      setBadge(editCourse.badge || "");
      setCategory(editCourse.category || "");
      setDescription(editCourse.description || "");
      setImage(editCourse.image || null);
      setImagePreview(editCourse.image || null);
    }
  }, [editCourse]);

  const handleImageChange = (file) => {
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const feesNumber = parseFloat(fees);
    if (isNaN(feesNumber) || feesNumber < 0) {
      toast.error("Please enter a valid course fee");
      return;
    }
    if (!duration.trim()) {
      toast.error("Please enter course duration");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter course name");
      return;
    }
    if (!category) {
      toast.error("Please select course category");
      return;
    }
    setLoading(true);
    try {
      const isEdit = !!editCourse;
      const isNewImage = image && typeof image !== "string";

      if (isNewImage) {
        // Use FormData when uploading a new image
        const formData = new FormData();
        formData.append("name", name);
        formData.append("fees", String(feesNumber));
        formData.append("duration", duration);
        formData.append("badge", badge);
        formData.append("category", category);
        formData.append("description", description);
        formData.append("image", image);

        if (isEdit) {
          await api.put(`/studentcourses/${editCourse._id}`, formData);
          toast.success("Course updated successfully!");
          navigate('/courses');
        } else {
          await api.post("/studentcourses", formData);
          toast.success("Course added successfully!");
        }
      } else {
        // Send JSON when not uploading a new image so backend parsers read fields like category
        const payload = {
          name,
          fees: feesNumber,
          duration,
          badge,
          category,
          description,
        };

        if (isEdit) {
          await api.put(`/studentcourses/${editCourse._id}`, payload);
          toast.success("Course updated successfully!");
          navigate('/courses');
        } else {
          await api.post("/studentcourses", payload);
          toast.success("Course added successfully!");
        }
      }
      if (!editCourse) {
        setName("");
        setFees("");
        setDuration("");
        setBadge("");
        setCategory("");
        setDescription("");
        setImage(null);
        setImagePreview(null);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex items-center gap-4">
            {editCourse && (
              <button
                onClick={() => navigate('/courses')}
                className="flex items-center gap-1 text-white hover:text-blue-200 transition"
                title="Back to Courses"
                type="button"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {editCourse ? <Save className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                {editCourse ? "Edit Course" : "Add New Course"}
              </h2>
              <p className="text-blue-100 mt-1">
                {editCourse ? "Update course information and materials" : "Create a new course with details and resources"}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Course Image</label>
              <div className="flex items-center gap-3">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Course preview"
                      className="w-32 h-32 rounded-lg object-cover border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                      title="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <input
                  id="course-image-input"
                  name="image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleImageChange(e.target.files[0])}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('course-image-input').click()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition cursor-pointer shadow-sm"
                >
                  <Upload className="w-5 h-5" />
                  Upload Image
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Course Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Course Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter course name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  required
                />
              </div>
              {/* Course Fees */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Course Fees</label>
                <div className="flex items-center gap-2">
                  <span className="text-lg text-gray-500">₹</span>
                  <input
                    type="number"
                    value={fees}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || parseFloat(value) >= 0) {
                        setFees(value);
                      }
                    }}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    required
                    min="0"
                    step="any"
                  />
                </div>
              </div>
              {/* Course Duration */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder="e.g. 3 months, 6 weeks"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  required
                />
              </div>
              {/* Course Badge */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Badge</label>
                <input
                  type="text"
                  value={badge}
                  onChange={e => setBadge(e.target.value)}
                  placeholder="e.g. Popular, New, Featured"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
              {/* Course Category */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white"
                  required
                >
                  <option value="" disabled>
                    Select Category
                  </option>
                  <option value="IT">IT</option>
                  <option value="Basic">Basic</option>
                </select>
              </div>
              {/* Course Description */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Enter course description..."
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                    {editCourse ? "Saving..." : "Adding..."}
                  </>
                ) : (
                  <>
                    {editCourse ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {editCourse ? "Save Changes" : "Add Course"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CourseForm;