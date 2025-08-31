import React, { useState } from 'react';
import { X, Loader } from 'react-feather';
// import '../styles/ChapterForm.css';

const ChapterForm = ({ onClose, onSave, nextOrder, editData, loading = false }) => {
  const [name, setName] = useState(editData ? editData.name : '');
  const [order, setOrder] = useState(editData ? editData.order : (nextOrder || 1));
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Chapter name is required');
      return;
    }
    if (!order || isNaN(order) || order < 1) {
      setError('Order must be a positive number');
      return;
    }
    onSave({ name, order: Number(order) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-2 p-6 md:p-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition"
          onClick={onClose}
          type="button"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-xl font-bold text-blue-700 mb-4 text-center">{editData ? 'Edit Chapter' : 'Add Chapter'}</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chapter Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter chapter name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No.</label>
            <input
              type="number"
              value={order}
              onChange={e => setOrder(e.target.value)}
              min={1}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>
          {error && <div className="text-red-600 text-sm font-medium text-center">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-5 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 font-semibold transition ${
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow transition flex items-center gap-2 ${
                loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? (editData ? 'Updating...' : 'Saving...') : (editData ? 'Update' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChapterForm; 