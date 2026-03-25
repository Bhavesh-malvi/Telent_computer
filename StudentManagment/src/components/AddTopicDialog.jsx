import React, { useState, useEffect } from 'react';
import { addTopicToChapter, editTopicInChapter } from '../services/api';
import { X } from 'react-feather';

const AddTopicDialog = ({ chapterId, onClose, onTopicAdded, editData, editIdx }) => {
  const [name, setName] = useState(editData?.name || '');
  const [driveLink, setDriveLink] = useState(editData?.pdf || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editData) {
      setName(editData.name || '');
      setDriveLink(editData.pdf || '');
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editData && typeof editIdx === 'number') {
        await editTopicInChapter(chapterId, editIdx, { name, pdf: driveLink });
      } else {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('pdf', driveLink);
        await addTopicToChapter(chapterId, formData);
      }
      setLoading(false);
      if (onTopicAdded) onTopicAdded();
      onClose();
    } catch{
      setError('Failed to save topic');
      setLoading(false);
    }
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
        <h3 className="text-xl font-bold text-blue-700 mb-4 text-center">{editData ? 'Edit Topic' : 'Add Topic'}</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="Enter topic name..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PDF Link (Google Drive)</label>
            <input
              type="url"
              value={driveLink}
              onChange={e => setDriveLink(e.target.value)}
              placeholder="https://drive.google.com/..."
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
              className="px-5 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? (editData ? 'Updating...' : 'Adding...') : (editData ? 'Update Topic' : 'Add Topic')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTopicDialog; 